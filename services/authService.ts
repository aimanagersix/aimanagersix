import { getSupabase } from './supabaseClient';

const sb = () => getSupabase();

/**
 * Serviço de Autenticação v1.11 (Project Domain Validation)
 * Focado em garantir que o pedido vai para o projeto correto (yyiwkrkuhlkqibhowdmq).
 */
export const adminResetPassword = async (userId: string, newPassword: string) => {
    const cleanUserId = String(userId || '').trim();
    const cleanPassword = String(newPassword || '').trim();

    if (!cleanUserId || !cleanPassword) {
        throw new Error("ID de utilizador ou nova password inválidos.");
    }

    // Diagnóstico de Domínio (F12)
    const supabaseUrl = (sb() as any).supabaseUrl || 'unknown';
    console.log(`[AuthService] Iniciando Reset v1.11`);
    console.log(`[AuthService] Destino: ${supabaseUrl}`);
    console.log(`[AuthService] Alvo UUID: ${cleanUserId}`);
    
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
            if (error.message?.includes('User not found')) {
                errorMsg = `Erro: O utilizador ${cleanUserId} não existe na base de dados AUTH do projeto ${supabaseUrl}.`;
            } else if (error.status === 404) {
                errorMsg = "A Edge Function não foi encontrada no servidor. Verifique se o deploy foi feito para o projeto yyiwkrkuhlkqibhowdmq.";
            } else {
                errorMsg = `Erro Técnico: ${error.message}`;
            }
            
            throw new Error(errorMsg);
        }
        
        await sb().from('collaborators').update({ 
            password_updated_at: new Date().toISOString() 
        }).eq('id', cleanUserId);
        
        return { success: true, data };
    } catch (e: any) {
        console.error("[AuthService] Exceção:", e);
        throw e;
    }
};

export const updateMyPhoto = async (userId: string, photoUrl: string) => {
    const { error } = await sb().from('collaborators').update({ photo_url: photoUrl }).eq('id', userId);
    if (error) throw error;
};