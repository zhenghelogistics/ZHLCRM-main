import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import * as leadsService from '../services/leadsService';
import { seedDatabaseWithSampleData } from '../services/sampleDataService';
import { Lead, LeadStatus } from '../types';

export function useLeads() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const leadsRef = useRef<Lead[]>([]);
    leadsRef.current = leads;

    const fetchLeads = useCallback(async () => {
        try {
            const data = await leadsService.getLeads();
            setLeads(data);
        } catch (err) {
            console.error('Failed to fetch leads:', err);
        }
    }, []);

    // Initial load + seed sample data if DB is empty
    useEffect(() => {
        (async () => {
            setIsLoading(true);
            try {
                await seedDatabaseWithSampleData();
                await fetchLeads();
            } catch (err) {
                setError('Could not connect to the database. Please check your Supabase configuration.');
            } finally {
                setIsLoading(false);
            }
        })();
    }, [fetchLeads]);

    // Real-time subscription — re-fetch whenever any lead row changes
    useEffect(() => {
        const channel = supabase
            .channel('leads-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchLeads]);

    // Ghost cull + stage advancement — runs every 60 seconds
    // Uses a ref so it always reads the latest leads without needing them as a dependency
    useEffect(() => {
        const cullLeads = async () => {
            const now = Date.now();
            const twentyFourHours = 24 * 60 * 60 * 1000;
            const threeHours = 3 * 60 * 60 * 1000;
            const sixHours = 6 * 60 * 60 * 1000;

            for (const lead of leadsRef.current) {
                if (lead.status !== LeadStatus.QUOTE_SENT) continue;
                const elapsed = now - new Date(lead.createdAt).getTime();

                if (elapsed > twentyFourHours) {
                    await leadsService.updateLead(lead.id, { status: LeadStatus.LOST_GHOSTED });
                    continue;
                }

                let newStage = lead.stage;
                if (elapsed > sixHours) newStage = 'T-24h (Nurture)';
                else if (elapsed > threeHours) newStage = 'T+6h';
                else if (lead.stage === 'T-0 (Initial)' && elapsed > 0) newStage = 'T+3h';

                if (newStage !== lead.stage) {
                    await leadsService.updateLead(lead.id, { stage: newStage });
                }
            }
            // Real-time subscription picks up DB changes automatically — no manual refetch needed
        };

        const interval = setInterval(cullLeads, 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const addLead = async (leadData: Omit<Lead, 'id'>): Promise<string> => {
        return leadsService.addLead(leadData);
        // Real-time subscription will update state
    };

    const updateLead = async (id: string, updates: Partial<Lead>): Promise<void> => {
        // Optimistic update for instant UI feedback
        setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
        await leadsService.updateLead(id, updates);
    };

    const deleteLead = async (id: string): Promise<void> => {
        // Optimistic update for instant UI feedback
        setLeads(prev => prev.filter(l => l.id !== id));
        try {
            await leadsService.deleteLead(id);
        } catch (err: any) {
            // Rollback on failure
            await fetchLeads();
            throw err;
        }
    };

    return { leads, isLoading, error, addLead, updateLead, deleteLead };
}
