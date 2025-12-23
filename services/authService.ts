import { getSupabase } from './supabaseClient';

const sb = () => getSupabase();

/**
 * Serviço de Autenticação v1.7 (Robust Invoke)
 * Otimizado para garantir que o 'action' e o corpo chegam à Edge Function corretamente.
 */
export const adminResetPassword = async (userId: string, newPassword: string) => {
    // Pedido 4: Validação e normalização rigorosa do payload
    const cleanUserId = String(userId || '').trim();
    const cleanPassword = String(newPassword || '').trim();

    if (!cleanUserId || !cleanPassword) {
        throw new Error("ID de utilizador ou nova password inválidos.");
    }

    // Log para depuração local no browser (F12)
    console.log(`[AuthService] Iniciando reset administrativo (v1.7) para: ${cleanUserId}`);
    
    const payload = { 
        action: 'update_password', 
        targetUserId: cleanUserId, 
        newPassword: cleanPassword 
    };

    try {
        // Pedido 4: Invocação com cabeçalho explícito para evitar erros de parsing no Deno
        const { data, error } = await sb().functions.invoke('admin-auth-helper', {
            body: payload,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (error) {
            console.error("[AuthService] Resposta da Edge Function:", error);
            
            let errorMsg = "Falha no reset de password.";
            if (error.message?.includes('Ação ""') || error.message?.includes('não suportada')) {
                errorMsg = "A Edge Function recebeu um payload vazio ou inválido. Verifique os logs do servidor para o texto bruto.";
            } else if (error.status === 400) {
                errorMsg = `Erro de pedido (400): ${error.message}`;
            } else {
                errorMsg = `Erro técnico (${error.status || 'Deno'}): ${error.message}`;
            }
            
            throw new Error(errorMsg);
        }
        
        // Sincronização de metadados na base de dados pública após sucesso
        await sb().from('collaborators').update({ 
            password_updated_at: new Date().toISOString() 
        }).eq('id', cleanUserId);
        
        console.log(`[AuthService] Password atualizada com sucesso para ${cleanUserId}`);
        return { success: true, data };
    } catch (e: any) {
        console.error("[AuthService] Exceção crítica na chamada:", e);
        throw e;
    }
};

export const updateMyPhoto = async (userId: string, photoUrl: string) => {
    const { error } = await sb().from('collaborators').update({ photo_url: photoUrl }).eq('id', userId);
    if (error) throw error;
};