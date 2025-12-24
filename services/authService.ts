import { getSupabase } from './supabaseClient';

const sb = () => getSupabase();

/**
 * Serviço de Autenticação v1.20 (Clean RPC)
 * Otimizado para o fluxo de "Auth-First" sincronizado com orgService.
 */
export const adminResetPassword = async (userId: string, newPassword: string) => {
    const cleanUserId = String(userId || '').trim();
    const cleanPassword = String(newPassword || '').trim();

    if (!cleanUserId || !cleanPassword) {
        throw new Error("ID de utilizador ou nova password inválidos.");
    }

    // Payload limpo para o SDK
    const payload = { 
        action: 'update_password', 
        targetUserId: cleanUserId, 
        newPassword: cleanPassword 
    };

    try {
        const { data, error } = await sb().functions.invoke('admin-auth-helper', {
            body: payload
        });
        
        if (error) {
            console.error("[AuthService] Erro Edge Function:", error);
            throw new Error(`Falha no servidor de autenticação: ${error.message}`);
        }
        
        await sb().from('collaborators').update({ 
            password_updated_at: new Date().toISOString() 
        }).eq('id', cleanUserId);
        
        return { success: true, data };
    } catch (e: any) {
        throw e;
    }
};

/**
 * Provisionamento forçado ou inicial de utilizador.
 */
export const adminProvisionUser = async (userId: string, email: string, initialPassword: string) => {
    const payload = { 
        action: 'create_user', 
        email: email.trim(), 
        password: initialPassword.trim(),
        targetUserId: userId 
    };

    try {
        const { data, error } = await sb().functions.invoke('admin-auth-helper', {
            body: payload
        });

        if (error) {
            console.error("[AuthService] Erro no provisionamento:", error);
            throw new Error(`Erro ao provisionar conta Auth: ${error.message}`);
        }

        return { success: true, user: data.user };
    } catch (e: any) {
        throw e;
    }
};

export const updateMyPhoto = async (userId: string, photoUrl: string) => {
    const { error } = await sb().from('collaborators').update({ photo_url: photoUrl }).eq('id', userId);
    if (error) throw error;
};