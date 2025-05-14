function render3DPurityChart() {
  const container = document.getElementById("chart-container");
  container.innerHTML = "";

  const div = document.createElement("div");
  div.style.width = "100%";
  div.style.height = "600px";
  container.appendChild(div);

  const myChart = echarts.init(div);

  const selectedModels = chartData.raw.map(d => d.model_id).filter((v, i, a) => a.indexOf(v) === i && document.getElementById(`model-${v}`)?.checked);
  const selectedCats = ["RECYCLABLE", "HOUSEHOLD", "HAZARDOUS", "RESIDUAL"].filter(cat =>
    chartData.raw.some(d => d.correct_category === cat) &&
    document.getElementById(`cat-${cat}`)?.checked
  );

  const data = [];

  selectedModels.forEach((model, modelIndex) => {
    selectedCats.forEach((cat, catIndex) => {
      const item = chartData.raw.find(d => d.model_id === model && d.correct_category === cat);
      if (item) {
        const total = item.total || 0;
        const correct = item.correct || 0;
        const wrongRate = total ? (1 - correct / total) * 100 : 0;
        data.push({
          value: [modelIndex, catIndex, wrongRate.toFixed(2)],
          model: model,
          category: categoryMap[cat] || cat,
          wrongRate: wrongRate.toFixed(2)
        });
      }
    });
  });

  const option = {
    tooltip: {
      formatter: function (params) {
        return `
          Model: <b>${params.data.model}</b><br/>
          Category: <b>${params.data.category}</b><br/>
          Misclassification Rate: <b>${params.data.wrongRate}%</b>
        `;
      }
    },
    visualMap: {
      max: 100,
      inRange: {
        color: ['#00BFFF', '#FFD700', '#FF4500', '#FF0000']
      },
      text: ['High Misclassification', 'Low Misclassification'],
      calculable: true,
      orient: 'vertical',
      left: 'left',
      bottom: '20'
    },
    xAxis3D: {
      type: 'category',
      name: 'Model',
      data: selectedModels
    },
    yAxis3D: {
      type: 'category',
      name: 'Category',
      data: selectedCats.map(cat => categoryMap[cat] || cat)
    },
    zAxis3D: {
      type: 'value',
      name: 'Misclassification Rate (%)'
    },
    grid3D: {
      boxWidth: 200,
      boxDepth: 120,
      viewControl: {
        projection: 'perspective',
        autoRotate: false,
        damping: 0.5
      },
      light: {
        main: {
          intensity: 1.2,
          shadow: true
        },
        ambient: {
          intensity: 0.3
        }
      }
    },
    series: [{
      type: 'bar3D',
      data: data,
      shading: 'color',

      label: {
        show: true,
        formatter: (params) => `${params.data.wrongRate}%`,
        fontSize: 14,
        color: '#333'
      },

      emphasis: {
        label: {
          show: true,
          fontSize: 18,
          color: '#000'
        },
        itemStyle: {
          color: '#ff4d4f'  // Highlight color on hover
        }
      }
    }]
  };

  myChart.setOption(option);
}
