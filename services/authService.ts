import { getSupabase } from './supabaseClient';

const sb = () => getSupabase();

export const adminResetPassword = async (userId: string, newPassword: string) => {
    // Pedido 8: Garantir que o payload segue rigorosamente a expectativa da Edge Function
    console.log(`[AuthService] A iniciar pedido de reset administrativo para: ${userId}`);
    
    try {
        const { data, error } = await sb().functions.invoke('admin-auth-helper', {
            body: { 
                action: 'update_password', 
                targetUserId: userId, 
                newPassword: newPassword 
            }
        });
        
        if (error) {
            console.error("[AuthService] Erro retornado pela Edge Function:", error);
            
            // Tratamento de erro detalhado para o utilizador
            let errorMessage = "Erro ao atualizar password.";
            
            if (error.message?.includes('404')) {
                errorMessage = "A Função de Autenticação (admin-auth-helper) não foi encontrada no projeto. Por favor, publique-a via CLI conforme o guia no menu de Base de Dados.";
            } else if (error.message?.includes('failed to fetch')) {
                errorMessage = "Não foi possível contactar a Edge Function. Verifique a sua ligação ou se a função está ativa.";
            } else {
                errorMessage = `Erro técnico: ${error.message || "Código de estado não-2xx"}`;
            }
            
            throw new Error(errorMessage);
        }
        
        console.log(`[AuthService] Password atualizada com sucesso para ${userId}`);
        
        // Atualiza o timestamp local para controlo de expiração futuro
        await sb().from('collaborators').update({ 
            password_updated_at: new Date().toISOString() 
        }).eq('id', userId);
        
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