function renderPurityChart() {
    chartData.charts.forEach(chart => chart.destroy());
    chartData.charts = [];
  
    const container = document.getElementById("chart-container");
    container.innerHTML = "";
  
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);
    const ctx = canvas.getContext("2d");
  
    const selectedModels = chartData.raw.map(d => d.model_id).filter((v, i, a) => a.indexOf(v) === i && document.getElementById(`model-${v}`)?.checked);
    const selectedCats = ["RECYCLABLE", "HOUSEHOLD", "HAZARDOUS", "RESIDUAL"].filter(cat =>
      chartData.raw.some(d => d.correct_category === cat) &&
      document.getElementById(`cat-${cat}`)?.checked
    );
  
    const labels = selectedCats.map(cat => categoryMap[cat] || cat);
  
    const datasets = selectedModels.map(model => {
      return {
        label: model,
        data: selectedCats.map(cat => {
          const item = chartData.raw.find(d => d.model_id === model && d.correct_category === cat);
          if (!item) return 0;
          const total = item.total || 0;
          const correct = item.correct || 0;
          const wrong_rate = total ? (1 - correct / total) * 100 : 0;
          return wrong_rate.toFixed(2);
        }),
        backgroundColor: chartData.colors[model],
        borderColor: chartData.colors[model],
        borderWidth: 1
      };
    });
  
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: '各模型各分类的纯度 (错分率 %)',
            font: { size: 18 }
          },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.raw}%`
            }
          },
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: '分类'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: '错分率 (%)'
            },
            max: 100
          }
        }
      }
    });
  
    chartData.charts.push(chart);
  }
  