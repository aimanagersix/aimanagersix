import { getSupabase } from './supabaseClient';

const sb = () => getSupabase();

/**
 * Serviço de Autenticação v1.4 (Repair Mode)
 * Focado na correção do erro de reset administrativo.
 */
export const adminResetPassword = async (userId: string, newPassword: string) => {
    // Pedido 4: Normalização extrema do payload para evitar erros de parsing no Deno/Edge
    const cleanUserId = String(userId || '').trim();
    const cleanPassword = String(newPassword || '').trim();

    if (!cleanUserId || !cleanPassword) {
        throw new Error("ID de utilizador ou nova password inválidos.");
    }

    console.log(`[AuthService] Iniciando invoke para reset de: ${cleanUserId}`);
    
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
            console.error("[AuthService] Resposta de erro da Edge Function:", error);
            
            // O erro reportado pelo utilizador "Ação não é suportada" vem daqui
            let errorMsg = "Falha no reset de password.";
            
            if (error.message?.includes('Ação ""') || error.message?.includes('Ação inválida')) {
                errorMsg = "O comando enviado não foi reconhecido pela Edge Function. Verifique se o código mais recente foi publicado no projeto yyiwkrkuhlkqibhowdmq.";
            } else if (error.message?.includes('Requested entity was not found')) {
                errorMsg = "A Edge Function 'admin-auth-helper' não foi encontrada. Por favor, faça o deploy via CLI.";
            } else {
                errorMsg = `Erro técnico: ${error.message}`;
            }
            
            throw new Error(errorMsg);
        }
        
        // Atualiza o metadado local de conformidade
        await sb().from('collaborators').update({ 
            password_updated_at: new Date().toISOString() 
        }).eq('id', cleanUserId);
        
        return { success: true, data };
    } catch (e: any) {
        console.error("[AuthService] Exceção crítica no pedido:", e);
        throw e;
    }
};

export const updateMyPhoto = async (userId: string, photoUrl: string) => {
    const { error } = await sb().from('collaborators').update({ photo_url: photoUrl }).eq('id', userId);
    if (error) throw error;
};