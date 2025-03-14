/**
 * Script para inicializar o dashboard do CondoTech
 */
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar gráfico de condomínios se existir
    initCondominiosChart();

    // Função para inicializar o gráfico de distribuição por status
    function initCondominiosChart() {
        const canvas = document.getElementById('condominiosChart');
        if (!canvas) return; // Se não houver canvas, não tente criar o gráfico
        
        try {
            // Verificar se há dados no atributo data-stats
            let stats;
            if (canvas.hasAttribute('data-stats')) {
                try {
                    stats = JSON.parse(canvas.getAttribute('data-stats'));
                } catch (e) {
                    console.error('Erro ao parsear dados do gráfico:', e);
                    // Usa dados padrão em caso de erro
                    stats = {
                        ativos: 0,
                        inativos: 0,
                        prospectos: 0,
                        implementacao: 1,
                        abrePortas: 2,
                        agendados: 2
                    };
                }
            } else {
                // Se não tiver o atributo, buscar do objeto window se disponível
                stats = window.estatisticasCondominios || {
                    ativos: 0,
                    inativos: 0,
                    prospectos: 0,
                    implementacao: 1,
                    abrePortas: 2,
                    agendados: 2
                };
            }
            
            // Debug para verificar se os dados estão corretos
            console.log('Dados para o gráfico:', stats);
            
            // Criar gráfico
            const ctx = canvas.getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Ativos', 'Inativos', 'Prospectos', 'Implementação', 'Abre Portas', 'Agendado Visita'],
                    datasets: [{
                        data: [
                            stats.ativos || 0,
                            stats.inativos || 0,
                            stats.prospectos || 0,
                            stats.implementacao || 0,
                            stats.abrePortas || 0,
                            stats.agendados || 0
                        ],
                        backgroundColor: [
                            '#28a745', // verde - ativo
                            '#dc3545', // vermelho - inativo
                            '#ffc107', // amarelo - prospecto
                            '#17a2b8', // azul claro - implementação
                            '#007bff', // azul - abre portas
                            '#6c757d'  // cinza - agendado
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    }
                }
            });
            
            console.log('Gráfico inicializado com sucesso');
        } catch (e) {
            console.error('Erro ao inicializar gráfico:', e);
        }
    }
});