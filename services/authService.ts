import { getSupabase } from './supabaseClient';

const sb = () => getSupabase();

/**
 * Serviço de Autenticação v1.14 (Deployment Diagnostic)
 * Focado em distinguir erros de servidor de erros de privilégios de conta local.
 */
export const adminResetPassword = async (userId: string, newPassword: string) => {
    const cleanUserId = String(userId || '').trim();
    const cleanPassword = String(newPassword || '').trim();

    if (!cleanUserId || !cleanPassword) {
        throw new Error("ID de utilizador ou nova password inválidos.");
    }

    console.log(`[AuthService] Reset v1.14 -> Target: ${cleanUserId}`);
    
    const payload = { 
        action: 'update_password', 
        targetUserId: cleanUserId, 
        newPassword: cleanPassword 
    };

    try {
        const { data, error } = await sb().functions.invoke('admin-auth-helper', {
            body: payload,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (error) {
            console.error("[AuthService] Erro na Edge Function:", error);
            
            // Tratamento detalhado de erros de deploy/privilégios
            if (error.status === 403 || error.message?.includes('privileges')) {
                throw new Error("ERRO_PRIVILEGIOS: A conta ligada ao terminal não tem permissão para gerir o projeto yyiwkrkuhlkqibhowdmq. Siga o Guia de Resgate no painel BD.");
            }
            
            if (error.message?.includes('User not found')) {
                throw new Error("USER_NOT_FOUND");
            }
            
            if (error.status === 404 || error.message?.includes('not found')) {
                throw new Error("ERRO_DEPLOY: A Edge Function não foi encontrada. Certifique-se de que o deploy foi bem sucedido.");
            }
            
            throw new Error(`Erro Técnico: ${error.message}`);
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
    console.log(`[AuthService] Provisioning v1.14 -> ${email}`);
    
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
                'Content-Type': 'application/json'
            }
        });

        if (error) {
            if (error.status === 403) throw new Error("A chave de serviço não tem permissão para criar utilizadores. Verifique o SB_SERVICE_ROLE_KEY.");
            throw new Error(`Erro ao provisionar conta: ${error.message}`);
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