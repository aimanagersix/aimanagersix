import { getSupabase } from './supabaseClient';

const sb = () => getSupabase();

/**
 * Serviço de Autenticação v1.5 (Repair Mode)
 * Otimizado para evitar erros de status não-2xx nas Edge Functions.
 */
export const adminResetPassword = async (userId: string, newPassword: string) => {
    // Pedido 4: Validação e normalização rigorosa do payload
    const cleanUserId = String(userId || '').trim();
    const cleanPassword = String(newPassword || '').trim();

    if (!cleanUserId || !cleanPassword) {
        throw new Error("ID de utilizador ou nova password inválidos.");
    }

    // Log para depuração local no browser
    console.log(`[AuthService] Iniciando reset administrativo para utilizador: ${cleanUserId}`);
    
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
            console.error("[AuthService] Erro retornado pela Edge Function:", error);
            
            // Tratamento de erros comuns baseado no feedback do servidor
            let errorMsg = "Falha no reset de password.";
            
            if (error.message?.includes('404')) {
                errorMsg = "A Edge Function 'admin-auth-helper' não foi encontrada. Certifique-se de que fez o deploy no Supabase.";
            } else if (error.message?.includes('400')) {
                errorMsg = "Pedido inválido. Verifique se o código da função no Supabase está atualizado para a v6.0.";
            } else {
                errorMsg = `Erro técnico (${error.status || 'Deno'}): ${error.message}`;
            }
            
            throw new Error(errorMsg);
        }
        
        // Sincronização de metadados na base de dados pública após sucesso no Auth
        await sb().from('collaborators').update({ 
            password_updated_at: new Date().toISOString() 
        }).eq('id', cleanUserId);
        
        console.log(`[AuthService] Password atualizada com sucesso para ${cleanUserId}`);
        return { success: true, data };
    } catch (e: any) {
        console.error("[AuthService] Exceção crítica durante o invoke:", e);
        throw e;
    }
};

export const updateMyPhoto = async (userId: string, photoUrl: string) => {
    const { error } = await sb().from('collaborators').update({ photo_url: photoUrl }).eq('id', userId);
    if (error) throw error;
};