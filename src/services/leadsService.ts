import { supabase } from '../lib/supabase';
import { Lead, MonthlyArchive } from '../types';

// --- Leads ---

export const getLeads = async (): Promise<Lead[]> => {
    const { data, error } = await supabase.from('leads').select('*');
    if (error) throw error;
    return (data || []) as Lead[];
};

export const addLead = async (leadData: Omit<Lead, 'id'>): Promise<string> => {
    const { data, error } = await supabase.from('leads').insert(leadData).select('id').single();
    if (error) throw error;
    return data.id;
};

export const updateLead = async (id: string, updates: Partial<Lead>): Promise<void> => {
    const { error } = await supabase.from('leads').update(updates).eq('id', id);
    if (error) throw error;
};

export const deleteLead = async (id: string): Promise<void> => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
};

// --- Archives ---

export const getArchives = async (): Promise<MonthlyArchive[]> => {
    const { data, error } = await supabase.from('monthly_archives').select('*');
    if (error) throw error;
    return (data || []) as MonthlyArchive[];
};

export const archiveLeads = async (archiveId: string, displayName: string, leadsToArchive: Lead[]): Promise<void> => {
    if (leadsToArchive.length === 0) return;

    const { data: existing } = await supabase
        .from('monthly_archives')
        .select('leads')
        .eq('id', archiveId)
        .maybeSingle();

    const existingLeads: Lead[] = existing?.leads || [];
    const allArchivedLeads = [...existingLeads, ...leadsToArchive];

    const { error: upsertError } = await supabase
        .from('monthly_archives')
        .upsert({ id: archiveId, displayName, leads: allArchivedLeads });
    if (upsertError) throw upsertError;

    const leadIds = leadsToArchive.map(l => l.id);
    const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .in('id', leadIds);
    if (deleteError) throw deleteError;
};
