import { getSupabase } from './supabaseClient';

const sb = () => getSupabase();

/**
 * Serviço de Autenticação v1.18 (Stream Integrity)
 * Focado em garantir que o payload JSON é interpretado corretamente pelo Deno.
 */
export const adminResetPassword = async (userId: string, newPassword: string) => {
    const cleanUserId = String(userId || '').trim();
    const cleanPassword = String(newPassword || '').trim();

    if (!cleanUserId || !cleanPassword) {
        throw new Error("ID de utilizador ou nova password inválidos.");
    }

    console.log(`[AuthService] Reset v1.18 -> Target: ${cleanUserId}`);
    
    const payload = { 
        action: 'update_password', 
        targetUserId: cleanUserId, 
        newPassword: cleanPassword 
    };

    try {
        const { data, error } = await sb().functions.invoke('admin-auth-helper', {
            body: payload,
            headers: {
                'Content-Type': 'application/json',
                'X-Client-Info': 'aimanager-web'
            }
        });
        
        if (error) {
            console.error("[AuthService] Erro na Edge Function:", error);
            
            let detailedMsg = error.message;
            try {
                // Tentativa de obter JSON de erro estruturado
                const responseData = await error.context?.json();
                if (responseData?.error) detailedMsg = responseData.error;
            } catch (e) {}

            if (error.status === 403 || detailedMsg?.includes('privileges')) {
                throw new Error("ERRO_PRIVILEGIOS: Verifique o SB_SERVICE_ROLE_KEY nos Secrets do projeto.");
            }
            
            if (detailedMsg?.includes('User not found') || error.status === 404) {
                throw new Error("USER_NOT_FOUND: O utilizador não tem conta Auth no Supabase.");
            }
            
            throw new Error(`Erro na Função (${error.status || '400'}): ${detailedMsg}`);
        }
        
        await sb().from('collaborators').update({ 
            password_updated_at: new Date().toISOString() 
        }).eq('id', cleanUserId);
        
        return { success: true, data };
    } catch (e: any) {
        console.error("[AuthService] Exceção crítica:", e);
        throw e;
    }
};

/**
 * Provisionamento forçado de utilizador.
 */
export const adminProvisionUser = async (userId: string, email: string, initialPassword: string) => {
    console.log(`[AuthService] Provisioning v1.18 -> ${email}`);
    
    const payload = { 
        action: 'create_user', 
        email: email.trim(), 
        password: initialPassword.trim(),
        targetUserId: userId 
    };

    try {
        const { data, error } = await sb().functions.invoke('admin-auth-helper', {
            body: payload,
            headers: {
                'Content-Type': 'application/json',
                'X-Client-Info': 'aimanager-web'
            }
        });

        if (error) {
            console.error("[AuthService] Erro no provisionamento:", error);
            
            let detailedMsg = error.message;
            try {
                const responseData = await error.context?.json();
                if (responseData?.error) detailedMsg = responseData.error;
            } catch (e) {}

            throw new Error(`Erro ao provisionar conta: ${detailedMsg}`);
        }

        if (data.user?.id && data.user.id !== userId) {
            await sb().from('collaborators').update({ id: data.user.id }).eq('id', userId);
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