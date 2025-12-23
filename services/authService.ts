import { getSupabase } from './supabaseClient';

const sb = () => getSupabase();

/**
 * Serviço de Autenticação v1.9 (Payload Sanity)
 * Garante que o objeto de pedido está limpo de carateres de controle e segue a estrutura JSON esperada pelo Deno.
 */
export const adminResetPassword = async (userId: string, newPassword: string) => {
    // Pedido 4: Normalização total para evitar erros de stream/parsing
    const cleanUserId = String(userId || '').trim();
    const cleanPassword = String(newPassword || '').trim();

    if (!cleanUserId || !cleanPassword) {
        throw new Error("ID de utilizador ou nova password inválidos.");
    }

    // Log detalhado no console do browser (Visível com F12)
    console.log(`[AuthService] Reset RPC v1.9 -> User: ${cleanUserId}`);
    
    const payload = { 
        action: 'update_password', 
        targetUserId: cleanUserId, 
        newPassword: cleanPassword 
    };

    try {
        // Pedido 4: Invocação forçando Content-Type e capturando corpo da resposta
        const { data, error } = await sb().functions.invoke('admin-auth-helper', {
            body: JSON.stringify(payload), // Envio explícito como string para garantir integridade
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (error) {
            console.error("[AuthService] Erro retornado:", error);
            
            let errorMsg = "Falha no reset administrativo.";
            if (error.message?.includes('Ação ""')) {
                errorMsg = "O servidor não detetou o comando 'update_password'. Por favor, atualize a Edge Function para a v6.4 (Consola BD).";
            } else {
                errorMsg = `Erro Técnico: ${error.message}`;
            }
            
            throw new Error(errorMsg);
        }
        
        // Sincronização de conformidade local
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