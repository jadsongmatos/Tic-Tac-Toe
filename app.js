// Definindo o tamanho da grade 4D
const tamanho = 3;

// Gerando todas as possíveis direções em 4D (excluindo a direção nula)
const direcoes = [];
const direcaoPossiveis = [-1, 0, 1];
for (let dx of direcaoPossiveis) {
  for (let dy of direcaoPossiveis) {
    for (let dz of direcaoPossiveis) {
      for (let dw of direcaoPossiveis) {
        if (!(dx === 0 && dy === 0 && dz === 0 && dw === 0)) {
          direcoes.push([dx, dy, dz, dw]);
        }
      }
    }
  }
}

// Função para verificar se uma linha está dentro dos limites da grade
function linhaValida(start, direcao, tamanho) {
  const linha = [];
  for (let n = 0; n < tamanho; n++) {
    const ponto = [
      start[0] + direcao[0] * n,
      start[1] + direcao[1] * n,
      start[2] + direcao[2] * n,
      start[3] + direcao[3] * n,
    ];
    if (ponto.some((coord) => coord < 0 || coord >= tamanho)) {
      return null;
    }
    linha.push(ponto);
  }
  return linha;
}

// Coletando todas as linhas colineares sem duplicatas
const linhas = [];
for (let direcao of direcoes) {
  for (let start of cartesianProduct(
    [...Array(4)].map(() => [...Array(tamanho).keys()])
  )) {
    const linha = linhaValida(start, direcao, tamanho);
    if (linha) {
      // Para evitar duplicatas, apenas adicione linhas onde o ponto inicial é o menor possível
      if (arraysEqual(linha[0], start)) {
        linhas.push(linha);
      }
    }
  }
}

console.log(`Total de linhas colineares encontradas: ${linhas.length}`);

// Função auxiliar para gerar o produto cartesiano
function cartesianProduct(arrays) {
  return arrays.reduce(
    (acc, curr) => {
      const res = [];
      acc.forEach((a) => {
        curr.forEach((b) => {
          res.push(a.concat([b]));
        });
      });
      return res;
    },
    [[]]
  );
}

// Função auxiliar para comparar arrays
function arraysEqual(a, b) {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index])
  );
}

// Definindo uma paleta de cores para cada valor de W
const cores_w = {
  0: "red",
  1: "green",
  2: "blue",
  3: "orange",
  4: "purple",
  5: "cyan",
  6: "magenta",
  7: "yellow",
  8: "brown",
};

// Função para calcular o deslocamento baseado em W
function calcularDeslocamento(w, tamanho) {
  const deslocamentos = {
    'x': [0, 0, 0],
    'y': [w * 2, 0, 0],
    'z': [0, w * 1, 0],
  };
  const eixo = ['x', 'y', 'z'][w % 3]; // Alterna entre eixos
  return deslocamentos[eixo];
}

// Inicializando os filtros
const filtros = ["x", "y", "z", "w"];
filtros.forEach((filtro) => {
  const select = document.getElementById(`filtro-${filtro}`);
  for (let i = 0; i < tamanho; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.text = `${filtro.toUpperCase()}=${i}`;
    select.appendChild(option);
  }
  const optionAll = document.createElement("option");
  optionAll.value = "all";
  optionAll.text = "Todos";
  select.appendChild(optionAll);
});

// Função para atualizar o gráfico com base nos filtros
function atualizarGrafico() {
  const filtro_x = document.getElementById("filtro-x").value;
  const filtro_y = document.getElementById("filtro-y").value;
  const filtro_z = document.getElementById("filtro-z").value;
  const filtro_w = document.getElementById("filtro-w").value;

  // Filtrar as linhas com base nos filtros selecionados
  const linhas_filtradas = linhas.filter((linha) => {
    const [x, y, z, w] = linha[0];
    return (
      (filtro_x === "all" || x === parseInt(filtro_x)) &&
      (filtro_y === "all" || y === parseInt(filtro_y)) &&
      (filtro_z === "all" || z === parseInt(filtro_z)) &&
      (filtro_w === "all" || w === parseInt(filtro_w))
    );
  });

  // Preparar os traces para o Plotly, aplicando o deslocamento
  const traces = linhas_filtradas.map((linha) => {
    const x = linha.map((p) => p[0]);
    const y = linha.map((p) => p[1]);
    const z = linha.map((p) => p[2]);
    const w = linha[0][3]; // Coordenada W do ponto inicial
    const cor = cores_w[w] || "black"; // Cor baseada em W

    // Calcular deslocamento
    const [desloc_x, desloc_y, desloc_z] = calcularDeslocamento(w, tamanho);
    const x_desloc = x.map(xi => xi + desloc_x);
    const y_desloc = y.map(yi => yi + desloc_y);
    const z_desloc = z.map(zi => zi + desloc_z);

    return {
      x: x_desloc,
      y: y_desloc,
      z: z_desloc,
      mode: "lines",
      type: "scatter3d",
      line: {
        color: cor,
        width: 5,
      },
      opacity: 0.8,
      customdata: linha, // Passa as coordenadas originais como customdata
      hovertemplate: '<b>Coordenadas originais:</b><br>' +
                     `X: ${linha[0][0]}<br>` +
                     `Y: ${linha[0][1]}<br>` +
                     `Z: ${linha[0][2]}<br>` +
                     `W: ${linha[0][3]}<br><extra></extra>`,
    };
  });

  // Definir a legenda única para cores
  const unique_ws = [...new Set(linhas_filtradas.map(linha => linha[0][3]))];
  const legend_traces = unique_ws.map((w) => {
    if (w in cores_w) {
      return {
        x: [null], // Ponto fictício para legenda
        y: [null],
        z: [null],
        //mode: "markers",
        mode: "lines",
        type: "scatter3d",
        marker: {
          size: 0,
          color: cores_w[w],
        },
        name: `W=${w}`, // Rótulo da legenda
        showlegend: false
      };
    }
    return null;
  }).filter(trace => trace !== null);

  // Combinar os traces das linhas com os traces da legenda
  const all_traces = traces.concat(legend_traces);

  // Atualize o layout do gráfico para remover as grids
const layout = {
  title: "Linhas Colineares do Jogo da Velha em 4D",
  scene: {
    xaxis: { title: "X", range: [-0.5, tamanho * 2 - 0.5] },
    yaxis: { title: "Y", range: [-0.5, tamanho * 2 - 0.5] },
    zaxis: { title: "Z", range: [-0.5, tamanho - 0.5] },
  },
  /*
  legend: {
    itemsizing: "constant"
  },
  */
  showlegend: false,
  width: window.innerWidth,
  height:
    window.innerHeight -
    document.querySelector("header").offsetHeight -
    document.querySelector(".filtros").offsetHeight - 40,
};

// Chama a função de renderização do Plotly
Plotly.newPlot("grafico-3d", all_traces, layout, { responsive: true });


}

// Adicionar event listeners aos filtros
filtros.forEach((filtro) => {
  document
    .getElementById(`filtro-${filtro}`)
    .addEventListener("change", atualizarGrafico);
});

// Chamar a função inicialmente para exibir o gráfico completo
atualizarGrafico();

// Adicionar um listener para redimensionamento da janela para manter a responsividade
window.addEventListener("resize", atualizarGrafico);
