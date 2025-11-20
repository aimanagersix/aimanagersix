    const handleGenerateSecurityReport = (ticket: Ticket) => {
        const entity = entidades.find(e => e.id === ticket.entidadeId);
        const requester = collaborators.find(c => c.id === ticket.collaboratorId);
        const technician = ticket.technicianId ? collaborators.find(c => c.id === ticket.technicianId) : null;
        const affectedEquipment = ticket.equipmentId ? equipment.find(e => e.id === ticket.equipmentId) : null;
        const activities = ticketActivities.filter(ta => ta.ticketId === ticket.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Create collaborator map for report lookup
        const collaboratorMap = new Map(collaborators.map(c => [c.id, c.fullName]));

        // Build HTML Structure
        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6;">
                <div style="border-bottom: 3px solid #c0392b; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1 style="margin: 0; font-size: 24px; color: #c0392b;">Notificação de Incidente de Segurança</h1>
                        <span style="font-size: 12px; color: #666; text-transform: uppercase;">Conformidade NIS2 / RGPD</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; font-size: 14px;">ID: #${ticket.id.substring(0,8)}</div>
                        <div style="font-size: 12px;">Data: ${new Date().toLocaleDateString()}</div>
                    </div>
                </div>

                <div style="background-color: #f9f9f9; border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
                    <h3 style="margin-top: 0; border-bottom: 1px solid #ccc; padding-bottom: 5px;">1. Identificação</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px; font-weight: bold; width: 30%;">Organização Afetada:</td>
                            <td style="padding: 5px;">${entity?.name || 'N/A'} (${entity?.codigo || '-'})</td>
                        </tr>
                         <tr>
                            <td style="padding: 5px; font-weight: bold;">Reportado Por:</td>
                            <td style="padding: 5px;">${requester?.fullName || 'N/A'} (${requester?.email || '-'})</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px; font-weight: bold;">Responsável Técnico:</td>
                            <td style="padding: 5px;">${technician?.fullName || 'Não atribuído'}</td>
                        </tr>
                    </table>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">2. Detalhes do Incidente</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px; font-weight: bold; width: 30%;">Tipo de Incidente:</td>
                            <td style="padding: 5px; color: #c0392b; font-weight: bold;">${ticket.securityIncidentType || 'Genérico'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px; font-weight: bold;">Data/Hora Deteção:</td>
                            <td style="padding: 5px;">${new Date(ticket.requestDate).toLocaleString()}</td>
                        </tr>
                         <tr>
                            <td style="padding: 5px; font-weight: bold;">Estado Atual:</td>
                            <td style="padding: 5px;">${ticket.status}</td>
                        </tr>
                    </table>
                    <div style="margin-top: 10px;">
                        <span style="font-weight: bold; display: block; margin-bottom: 5px;">Descrição:</span>
                        <div style="padding: 10px; background-color: #fff; border: 1px solid #eee; font-style: italic;">
                            "${ticket.description}"
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">3. Análise de Impacto (C-I-A)</h3>
                    <table style="width: 100%; border: 1px solid #ddd; text-align: center; border-collapse: collapse;">
                        <thead style="background-color: #eee;">
                            <tr>
                                <th style="padding: 8px; border: 1px solid #ddd;">Criticidade Global</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">Confidencialidade</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">Integridade</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">Disponibilidade</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #c0392b;">${ticket.impactCriticality || 'N/A'}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${ticket.impactConfidentiality || 'N/A'}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${ticket.impactIntegrity || 'N/A'}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${ticket.impactAvailability || 'N/A'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                ${affectedEquipment ? `
                <div style="margin-bottom: 20px;">
                    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">4. Ativos Comprometidos</h3>
                     <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px; font-weight: bold; width: 30%;">Equipamento:</td>
                            <td style="padding: 5px;">${affectedEquipment.description}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px; font-weight: bold;">Marca/Modelo:</td>
                            <td style="padding: 5px;">${brands.find(b => b.id === affectedEquipment.brandId)?.name} / ${equipmentTypes.find(t => t.id === affectedEquipment.typeId)?.name}</td>
                        </tr>
                         <tr>
                            <td style="padding: 5px; font-weight: bold;">Nº Série:</td>
                            <td style="padding: 5px;">${affectedEquipment.serialNumber}</td>
                        </tr>
                    </table>
                </div>
                ` : ''}

                 <div style="margin-bottom: 20px;">
                    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">5. Cronologia de Resposta</h3>
                    ${activities.length > 0 ? `
                        <ul style="list-style-type: none; padding: 0;">
                            ${activities.map(act => `
                                <li style="margin-bottom: 10px; padding-left: 15px; border-left: 2px solid #ccc;">
                                    <div style="font-size: 11px; color: #777;">${new Date(act.date).toLocaleString()} - ${collaboratorMap.get(act.technicianId) || 'Técnico'}</div>
                                    <div style="font-size: 13px;">${act.description}</div>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p style="color: #777; font-style: italic;">Nenhuma intervenção registada até ao momento.</p>'}
                </div>

                <div style="margin-top: 50px; border-top: 2px solid #333; padding-top: 10px; display: flex; justify-content: space-between;">
                    <div style="text-align: center; width: 40%;">
                        <br><br>
                        <div style="border-top: 1px solid #999; font-size: 12px;">Assinatura do Responsável de Segurança</div>
                    </div>
                     <div style="text-align: center; width: 40%;">
                        <br><br>
                        <div style="border-top: 1px solid #999; font-size: 12px;">Data de Fecho / Aprovação</div>
                    </div>
                </div>
            </div>
        `;
        setSecurityReportHtml(html);
    };