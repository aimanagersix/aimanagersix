import { getSupabase } from './supabaseClient';

const sb = () => getSupabase();

/**
 * Serviço de Autenticação v1.13 (Provisioning Engine)
 * Focado em detetar utilizadores órfãos (existem na DB mas não no Auth) e repará-los.
 */
export const adminResetPassword = async (userId: string, newPassword: string) => {
    const cleanUserId = String(userId || '').trim();
    const cleanPassword = String(newPassword || '').trim();

    if (!cleanUserId || !cleanPassword) {
        throw new Error("ID de utilizador ou nova password inválidos.");
    }

    console.log(`[AuthService] Reset v1.13 -> Target: ${cleanUserId}`);
    
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
            
            // Tratamento específico para o erro reportado pelo utilizador (Pedido 4)
            if (error.message?.includes('User not found')) {
                throw new Error("USER_NOT_FOUND");
            }
            
            throw new Error(`Erro Técnico: ${error.message}`);
        }
        
        await sb().from('collaborators').update({ 
            password_updated_at: new Date().toISOString() 
        }).eq('id', cleanUserId);
        
        return { success: true, data };
    } catch (e: any) {
        console.error("[AuthService] Exceção crítica:", e);
        throw e;
    }
};

/**
 * Cria uma conta Auth para um colaborador que existe apenas na tabela public.
 */
export const adminProvisionUser = async (userId: string, email: string, initialPassword: string) => {
    console.log(`[AuthService] Provisioning v1.13 -> ${email}`);
    
    const payload = { 
        action: 'create_user', 
        email: email.trim(), 
        password: initialPassword.trim(),
        targetUserId: userId // Passamos o ID atual para a função tentar manter a consistência
    };

    const { data, error } = await sb().functions.invoke('admin-auth-helper', {
        body: payload,
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (error) {
        console.error("[AuthService] Falha no provisionamento:", error);
        throw new Error(`Erro ao provisionar conta: ${error.message}`);
    }

    // Se o ID mudou (o Supabase Auth gerou um novo UUID), precisamos de atualizar a tabela public
    if (data.user?.id && data.user.id !== userId) {
        console.log(`[AuthService] A atualizar ID do colaborador para: ${data.user.id}`);
        // Nota: Isto pode exigir desativar RLS temporariamente ou usar o service role se for chave estrangeira noutras tabelas
        await sb().from('collaborators').update({ id: data.user.id }).eq('id', userId);
    }

    return { success: true, user: data.user };
};

export const updateMyPhoto = async (userId: string, photoUrl: string) => {
    const { error } = await sb().from('collaborators').update({ photo_url: photoUrl }).eq('id', userId);
    if (error) throw error;
};