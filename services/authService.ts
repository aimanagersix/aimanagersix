import { getSupabase } from './supabaseClient';

const sb = () => getSupabase();

/**
 * Serviço de Autenticação v1.12 (Privilege Validation)
 * Focado em detetar erros de permissão (403) ou de deploy.
 */
export const adminResetPassword = async (userId: string, newPassword: string) => {
    const cleanUserId = String(userId || '').trim();
    const cleanPassword = String(newPassword || '').trim();

    if (!cleanUserId || !cleanPassword) {
        throw new Error("ID de utilizador ou nova password inválidos.");
    }

    // Diagnóstico de Conectividade (F12)
    const supabaseUrl = (sb() as any).supabaseUrl || 'unknown';
    console.log(`[AuthService] Reset v1.12 -> Target: ${cleanUserId}`);
    
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
            
            let errorMsg = "Falha no reset de password.";
            
            // Tratamento de privilégios insuficientes (Error 403 reportado pelo user no bash)
            if (error.status === 403) {
                errorMsg = "Erro de Privilégios (403): O sistema não tem permissão para aceder ao Auth. Verifique o SB_SERVICE_ROLE_KEY.";
            } else if (error.message?.includes('User not found')) {
                errorMsg = `Erro: O utilizador ${cleanUserId} não possui conta de login criada (Authentication -> Users).`;
            } else if (error.status === 404) {
                errorMsg = "Edge Function não encontrada. Por favor, execute o deploy no terminal.";
            } else {
                errorMsg = `Erro Técnico (${error.status || 'Deno'}): ${error.message}`;
            }
            
            throw new Error(errorMsg);
        }
        
        // Registo de auditoria local
        await sb().from('collaborators').update({ 
            password_updated_at: new Date().toISOString() 
        }).eq('id', cleanUserId);
        
        return { success: true, data };
    } catch (e: any) {
        console.error("[AuthService] Exceção crítica:", e);
        throw e;
    }
};

export const updateMyPhoto = async (userId: string, photoUrl: string) => {
    const { error } = await sb().from('collaborators').update({ photo_url: photoUrl }).eq('id', userId);
    if (error) throw error;
};