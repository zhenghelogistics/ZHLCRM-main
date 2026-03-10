import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import * as leadsService from '../services/leadsService';
import { Lead, MonthlyArchive } from '../types';

export function useArchives() {
    const [archives, setArchives] = useState<MonthlyArchive[]>([]);

    const fetchArchives = useCallback(async () => {
        try {
            const data = await leadsService.getArchives();
            setArchives(data.sort((a, b) => b.id.localeCompare(a.id)));
        } catch (err) {
            console.error('Failed to fetch archives:', err);
        }
    }, []);

    useEffect(() => {
        fetchArchives();
    }, [fetchArchives]);

    // Real-time subscription — re-fetch when any archive row changes
    useEffect(() => {
        const channel = supabase
            .channel('archives-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_archives' }, fetchArchives)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchArchives]);

    const archiveMonth = async (archiveId: string, displayName: string, leads: Lead[]): Promise<void> => {
        await leadsService.archiveLeads(archiveId, displayName, leads);
        // Real-time subscriptions on both 'leads' and 'monthly_archives' will update state automatically
    };

    return { archives, archiveMonth };
}
