import { getSupabase } from './supabaseClient';

const sb = () => getSupabase();

export const adminResetPassword = async (userId: string, newPassword: string) => {
    // Pedido 8: Garantir que o payload segue rigorosamente a expectativa da Edge Function
    console.log(`[AuthService] A solicitar reset de password para user ${userId}...`);
    
    const { data, error } = await sb().functions.invoke('admin-auth-helper', {
        body: { 
            action: 'update_password', 
            targetUserId: userId, 
            newPassword: newPassword 
        }
    });
    
    if (error) {
        console.error("Auth Helper Error:", error);
        // Erro detalhado para o utilizador final
        throw new Error(
            error.message?.includes('Failed to send a request') 
            ? "A Função de Autenticação (admin-auth-helper) não foi detetada. Por favor, publique a função via CLI ou verifique os logs no dashboard do Supabase."
            : error.message || "Falha na comunicação com a Edge Function de Autenticação."
        );
    }
    
    // Atualiza o timestamp local para controlo de expiração futuro
    await sb().from('collaborators').update({ 
        password_updated_at: new Date().toISOString() 
    }).eq('id', userId);
    
    console.log(`[AuthService] Password atualizada com sucesso para ${userId}`);
    return { success: true, data };
};

export const updateMyPhoto = async (userId: string, photoUrl: string) => {
    const { error } = await sb().from('collaborators').update({ photo_url: photoUrl }).eq('id', userId);
    if (error) throw error;
};