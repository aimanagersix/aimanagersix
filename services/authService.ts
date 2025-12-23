import { getSupabase } from './supabaseClient';

const sb = () => getSupabase();

/**
 * Serviço de Autenticação v1.6 (Payload Hardening)
 * Otimizado para garantir que o 'action' e o corpo do pedido chegam à Edge Function como JSON válido.
 */
export const adminResetPassword = async (userId: string, newPassword: string) => {
    // Pedido 4: Validação e normalização rigorosa do payload
    const cleanUserId = String(userId || '').trim();
    const cleanPassword = String(newPassword || '').trim();

    if (!cleanUserId || !cleanPassword) {
        throw new Error("ID de utilizador ou nova password inválidos.");
    }

    // Log para depuração local no browser (Visível no F12)
    console.log(`[AuthService] Iniciando reset administrativo (v1.6) para utilizador: ${cleanUserId}`);
    
    const payload = { 
        action: 'update_password', 
        targetUserId: cleanUserId, 
        newPassword: cleanPassword 
    };

    try {
        // Pedido 4: Invocação explícita com cabeçalho de Content-Type para forçar o Deno a interpretar como JSON
        const { data, error } = await sb().functions.invoke('admin-auth-helper', {
            body: payload,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (error) {
            console.error("[AuthService] Erro retornado pela Edge Function:", error);
            
            // Tratamento de erros comuns baseado no feedback do servidor
            let errorMsg = "Falha no reset de password.";
            
            if (error.message?.includes('404')) {
                errorMsg = "A Edge Function 'admin-auth-helper' não foi encontrada. Certifique-se de que fez o deploy no Supabase.";
            } else if (error.message?.includes('400')) {
                errorMsg = `Erro de Payload (400): ${error.message}. Verifique se o código da função no Supabase está atualizado para a v6.2 (Consola BD -> Gestão Auth).`;
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