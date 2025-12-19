
import { getSupabase } from './supabaseClient';

const sb = () => getSupabase();

export const adminResetPassword = async (userId: string, newPassword: string) => {
    const { data, error } = await sb().functions.invoke('admin-auth-helper', {
        body: { action: 'update_password', targetUserId: userId, newPassword: newPassword }
    });
    if (error) throw error;
    await sb().from('collaborators').update({ password_updated_at: new Date().toISOString() }).eq('id', userId);
    return { success: true };
};

export const updateMyPhoto = async (userId: string, photoUrl: string) => {
    const { error } = await sb().from('collaborators').update({ photoUrl }).eq('id', userId);
    if (error) throw error;
};
