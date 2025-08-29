// Chart management for Contudo application

class ChartManager {
    constructor() {
        this.monthlyChart = null;
        this.chartColors = {
            primary: '#4F46E5',
            success: '#10B981',
            warning: '#F59E0B',
            danger: '#EF4444',
            info: '#06B6D4',
            gray: '#6B7280'
        };
    }

    // Initialize monthly comparison chart
    initMonthlyChart() {
        const canvas = document.getElementById('monthlyChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Get historical data
        const historicalData = window.dataManager.getHistoricalData();
        const currentYear = parseInt(document.getElementById('year-select').value) || 2025;
        const yearData = historicalData[currentYear] || {};

        // Prepare chart data
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const chartData = [];

        months.forEach((month, index) => {
            const monthNumber = index + 1;
            const monthData = yearData[monthNumber] || { fixed: 0, variable: 0, total: 0 };
            chartData.push(monthData.total);
        });

        // Destroy existing chart if it exists
        if (this.monthlyChart) {
            this.monthlyChart.destroy();
        }

        // Create new chart
        this.monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Total de Gastos',
                    data: chartData,
                    backgroundColor: this.chartColors.primary,
                    borderColor: this.chartColors.primary,
                    borderWidth: 1,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1F2937',
                        titleColor: '#F9FAFB',
                        bodyColor: '#F9FAFB',
                        borderColor: '#374151',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `Total: ${UIComponents.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#E5E7EB'
                        },
                        ticks: {
                            color: '#6B7280',
                            callback: function(value) {
                                return UIComponents.formatCurrency(value);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6B7280'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                animation: {
                    duration: 800,
                    easing: 'easeInOutQuart'
                }
            }
        });

        // Add click handler for chart bars
        canvas.addEventListener('click', (event) => {
            const points = this.monthlyChart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
            if (points.length) {
                const firstPoint = points[0];
                const monthIndex = firstPoint.index;
                this.showMonthDetails(currentYear, monthIndex + 1);
            }
        });
    }

    // Show detailed breakdown for a specific month
    showMonthDetails(year, month) {
        const historicalData = window.dataManager.getHistoricalData();
        const monthData = historicalData[year] && historicalData[year][month];
        
        if (monthData) {
            const monthName = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][month - 1];
            
            UIComponents.showNotification(
                `Detalhes - ${monthName} ${year}`,
                `Fixos: ${UIComponents.formatCurrency(monthData.fixed)} | ` +
                `Diversos: ${UIComponents.formatCurrency(monthData.variable)} | ` +
                `Total: ${UIComponents.formatCurrency(monthData.total)}`,
                'info'
            );
        }
    }

    // Create category breakdown chart
    createCategoryChart(containerId, expenses) {
        const canvas = document.getElementById(containerId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Group expenses by category
        const categoryData = {};
        expenses.forEach(expense => {
            if (!categoryData[expense.category]) {
                categoryData[expense.category] = 0;
            }
            categoryData[expense.category] += expense.amount;
        });

        // Prepare chart data
        const labels = Object.keys(categoryData).map(cat => window.dataManager.getCategoryName(cat));
        const data = Object.values(categoryData);
        const colors = this.generateCategoryColors(labels.length);

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#FFFFFF'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            color: '#374151'
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1F2937',
                        titleColor: '#F9FAFB',
                        bodyColor: '#F9FAFB',
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${UIComponents.formatCurrency(context.parsed)} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%',
                animation: {
                    animateRotate: true,
                    duration: 1000
                }
            }
        });
    }

    // Create trend line chart
    createTrendChart(containerId, data) {
        const canvas = document.getElementById(containerId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Gastos',
                    data: data.values,
                    borderColor: this.chartColors.primary,
                    backgroundColor: `${this.chartColors.primary}20`,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.chartColors.primary,
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1F2937',
                        titleColor: '#F9FAFB',
                        bodyColor: '#F9FAFB',
                        borderColor: '#374151',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#E5E7EB'
                        },
                        ticks: {
                            color: '#6B7280',
                            callback: function(value) {
                                return UIComponents.formatCurrency(value);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6B7280'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                animation: {
                    duration: 1200,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    // Generate colors for categories
    generateCategoryColors(count) {
        const baseColors = [
            '#4F46E5', '#10B981', '#F59E0B', '#EF4444', 
            '#06B6D4', '#8B5CF6', '#EC4899', '#F97316'
        ];

        const colors = [];
        for (let i = 0; i < count; i++) {
            if (i < baseColors.length) {
                colors.push(baseColors[i]);
            } else {
                // Generate variations of base colors
                const baseIndex = i % baseColors.length;
                const opacity = 0.8 - (Math.floor(i / baseColors.length) * 0.2);
                colors.push(this.hexToRgba(baseColors[baseIndex], opacity));
            }
        }

        return colors;
    }

    // Convert hex to rgba
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Update chart data
    updateMonthlyChart(year) {
        if (!this.monthlyChart) return;

        const historicalData = window.dataManager.getHistoricalData();
        const yearData = historicalData[year] || {};

        const chartData = [];
        for (let month = 1; month <= 12; month++) {
            const monthData = yearData[month] || { total: 0 };
            chartData.push(monthData.total);
        }

        this.monthlyChart.data.datasets[0].data = chartData;
        this.monthlyChart.update('active');
    }

    // Create mini chart for dashboard cards
    createMiniChart(canvasId, data, color) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    borderColor: color,
                    backgroundColor: `${color}20`,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                },
                interaction: { intersect: false },
                animation: { duration: 0 }
            }
        });
    }

    // Animate chart numbers
    animateValue(element, start, end, duration) {
        const startTimestamp = Date.now();
        const step = (timestamp) => {
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = Math.floor(progress * (end - start) + start);
            element.textContent = UIComponents.formatCurrency(current);
            
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };
        requestAnimationFrame(step);
    }

    // Destroy all charts
    destroyAllCharts() {
        if (this.monthlyChart) {
            this.monthlyChart.destroy();
            this.monthlyChart = null;
        }
    }

    // Resize handler
    handleResize() {
        if (this.monthlyChart) {
            this.monthlyChart.resize();
        }
    }
}

// Create global chart manager instance
window.chartManager = new ChartManager();