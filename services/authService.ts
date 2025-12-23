import { getSupabase } from './supabaseClient';

const sb = () => getSupabase();

export const adminResetPassword = async (userId: string, newPassword: string) => {
    // Pedido 4: Garantir que o payload seja enviado de forma absolutamente limpa
    // Adicionados logs de pré-envio para depuração no ambiente de execução
    console.log(`[AuthService] A preparar pedido RPC para: ${userId}`);
    
    const payload = { 
        action: 'update_password', 
        targetUserId: userId.trim(), 
        newPassword: newPassword.trim() 
    };

    try {
        const { data, error } = await sb().functions.invoke('admin-auth-helper', {
            body: payload
        });
        
        if (error) {
            console.error("[AuthService] Falha Crítica na Edge Function:", error);
            
            let friendlyError = "A operação de reset falhou.";
            
            if (error.message?.includes('Ação inválida')) {
                friendlyError = "O servidor de autenticação não reconheceu o comando 'update_password'. Certifique-se de que a Edge Function está atualizada no projeto yyiwkrkuhlkqibhowdmq.";
            } else if (error.message?.includes('404')) {
                friendlyError = "Serviço de Autenticação indisponível (Erro 404). Contacte o suporte.";
            } else {
                friendlyError = `Erro da Edge Function: ${error.message}`;
            }
            
            throw new Error(friendlyError);
        }
        
        console.log(`[AuthService] Resposta da Função:`, data);
        
        // Sincronizar timestamp de atualização local
        await sb().from('collaborators').update({ 
            password_updated_at: new Date().toISOString() 
        }).eq('id', userId);
        
        return { success: true, data };
    } catch (e: any) {
        console.error("[AuthService] Exceção na chamada RPC:", e);
        throw e;
    }
};

export const updateMyPhoto = async (userId: string, photoUrl: string) => {
    const { error } = await sb().from('collaborators').update({ photo_url: photoUrl }).eq('id', userId);
    if (error) throw error;
};