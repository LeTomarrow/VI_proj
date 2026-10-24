# Conceitos para a apresentação

Notas de estudo para a apresentação da 1ª iteração. Os termos em inglês, entre parênteses, são
os que aparecem nos slides. As decisões e a justificação de cada view estão em
[02-visualization-choices.md](02-visualization-choices.md); os dados em
[01-data-analysis.md](01-data-analysis.md).

## 1. Unidades

| Unidade | O que é | Onde aparece |
|---|---|---|
| **TWh** (terawatt-hora) | Quantidade de eletricidade. 1 TWh = mil milhões de kWh. Portugal produz cerca de 50 TWh por ano; o mundo cerca de 31.000. | Geração, Views 2 e 4 |
| **MtCO₂e** / **GtCO₂e** | Milhões / mil milhões de toneladas de CO₂ equivalente. "Equivalente" quer dizer que os outros gases com efeito de estufa (metano, N₂O) são convertidos para a quantidade de CO₂ que aquece o mesmo. 1 Gt = 1.000 Mt. | Emissões totais, Views 3 e 4 |
| **gCO₂/kWh** | Gramas de CO₂ por cada kWh produzido, ou seja, a intensidade carbónica. | Views 1, 3 e 5 |
| **p.p.** (pontos percentuais) | Diferença entre duas percentagens: de 19% para 32% são +13 p.p. (não +13%). | Modo Change do mapa |

## 2. Fontes de eletricidade

- **Fósseis** (*fossil*): carvão, gás e petróleo. Queimam combustível e emitem CO₂.
- **Renováveis** (*renewable*): hídrica, solar, eólica, bioenergia e outras. Não se esgotam.
- **Nuclear**: não é renovável, mas quase não emite CO₂.
- **Baixo carbono** (*low-carbon*) = renováveis + nuclear. É o que conta para as emissões. Usamos
  este grupo na View 4 porque a França, por exemplo, é limpa sobretudo graças ao nuclear.

**Eletricidade vs. energia primária:** a eletricidade é só cerca de 20% de toda a energia
usada (os transportes e o aquecimento usam sobretudo petróleo e gás). Escolhemos a eletricidade
porque é a única família do dataset com dados por fonte para quase todos os países (~210
contra 79). Misturar as duas tornaria os países incomparáveis: em 2023 a eletricidade de
Portugal era 74% renovável, mas a energia total só 35%.

**Geração vs. procura:** medimos a eletricidade **gerada** e usamo-la como aproximação da
procura (*demand*).

## 3. Métricas

- **Quota** (*share*): a parte de uma fonte na geração total, em %.
- **Per capita**: o valor a dividir pela população. Permite comparar países grandes e pequenos.
- **Intensidade carbónica** (*carbon intensity*): quão "suja" é cada kWh. Perto de 1.000 g/kWh
  num país só a carvão; abaixo de 50 num país quase só hídrico e nuclear.
- **Emissões** = geração × intensidade carbónica. Confirmámos nos dados que esta igualdade bate
  certo em todas as 6.002 linhas que têm os três valores.

Modos do mapa (View 1):
- **Year:** o valor de um ano.
- **Range average:** a média de um intervalo de anos. Suaviza anos excecionais, por exemplo
  um ano seco que baixa a produção hídrica.
- **Change:** a diferença entre o primeiro e o último ano do intervalo. Serve para encontrar os
  países que vão contra a tendência.

## 4. A View 4 em detalhe

**Crescimento desde o ano inicial:** tudo é medido em relação ao início do intervalo escolhido
no mapa (por omissão 2000).
- *Procura nova* (*new demand*) = quanto a geração total cresceu.
- *Baixo carbono novo* (*new low-carbon generation*) = quanto cresceu a geração de baixo
  carbono.
- A diferença entre as duas é exatamente o que os fósseis cresceram.

**Decomposição** (*decomposition*): separa a variação das emissões em duas causas.
- **Efeito procura** (*demand effect*): mais eletricidade faz subir as emissões.
- **Efeito mix** (*mix effect*): um mix mais limpo faz descer as emissões.

Exemplo: um país passa de 100 TWh a 500 g/kWh (50 Mt) para 150 TWh a 400 g/kWh (60 Mt). As
emissões sobem +10 Mt, que se dividem em:
- efeito procura ≈ +25 Mt (os 50 TWh extra, ao mix antigo);
- efeito mix ≈ −15 Mt (o mix ficou mais limpo).

**LMDI** (*logarithmic mean Divisia index*): o método que usamos para fazer esta divisão. É
justo entre os dois fatores, e os dois efeitos somam **exatamente** a variação total.

**A mensagem central** (*greener, but not cleaner*): a eletricidade ficou mais verde, mas a
procura cresceu tão depressa que as emissões subiram na mesma.

## 5. Técnicas de visualização

| Conceito | O que é | View |
|---|---|---|
| **Choropleth** | Mapa em que cada país é pintado de acordo com um valor. | 1 |
| **Projeção ortográfica** | Desenha a Terra como uma esfera vista de longe (o globo). Só mostra metade de cada vez, por isso pode-se rodar. | 1 |
| **Equal Earth** | Projeção do mapa plano que mantém as áreas proporcionais. Ao contrário de Mercator, não aumenta a Rússia e o Canadá. | 1 |
| **Escala sequencial / divergente** | Sequencial: de claro a escuro, para valores de baixo a alto. Divergente: duas cores à volta de um centro (zero), para subidas e descidas. No nosso mapa, verde é sempre "mais verde ou mais limpo". | 1 |
| **Marimekko temporal** | Uma coluna por ano. A largura é a geração total, a altura de cada segmento é a quota da fonte, e a área do segmento é o que essa fonte produziu em TWh. Mostra o mix e o crescimento ao mesmo tempo. | 2 |
| **Bubble scatter** | Gráfico de pontos em que o tamanho da bolha é uma terceira variável. Nós usamos x = emissões per capita, y = intensidade carbónica, área = emissões totais. | 3 |
| **Escala logarítmica** | Cada passo do eixo multiplica (1, 10, 100…) em vez de somar. Serve quando os valores vão de muito pequenos a muito grandes. | 3 |
| **Brushing** | Arrastar um retângulo para selecionar um grupo de pontos. | 3 |
| **Difference chart** | Duas linhas com a área entre elas colorida conforme a linha que está por cima: verde se o baixo carbono cresceu mais do que a procura, vermelho se não cresceu. | 4 |
| **Radar / star glyph** | Um polígono com um eixo por variável. Cada país passa a ser uma forma. Problemas conhecidos: a área cresce com o quadrado dos valores e depende da ordem dos eixos. Por isso fixamos a ordem e mostramos os valores exatos ao passar o rato. | 5 |
| **Small multiples** | O mesmo gráfico repetido, um por país, lado a lado e com a mesma escala, para comparar formas. | 5 |

## 6. Conceitos de design

- **Linked views / coordinated multiple views:** várias vistas dos mesmos dados ligadas entre
  si. Selecionar um país ou um ano numa vista atualiza todas as outras ("select once, see
  everywhere"). Inspirado no InsightChaser (Liu et al., IEEE TVCG 2026), um paper estudado
  na cadeira.
- **Brushing and linking:** selecionar numa vista (brush no scatter) e ver o resultado
  destacado noutra (o mapa).
- **Mantra de Shneiderman:** *overview first, zoom and filter, then details on demand*. O mapa é
  a visão geral, o slider e os modos são o zoom e o filtro, e os tooltips e as Views 2 e 4
  são os detalhes.
- **Fatias do cubo de dados** (*data cube*): os dados são país × ano × variável. Cada view
  mostra uma fatia diferente, por isso as views não se repetem:
  - o mapa mostra todos os países num ano;
  - o Marimekko mostra um país em todos os anos;
  - os perfis mostram poucos países com muitas variáveis.
- **Martini glass** (Segel & Heer, 2010): começa com uma narrativa guiada (o haste do copo)
  e abre depois para exploração livre. É a razão da ordem das views: mapa → eletricidade →
  emissões → green growth (causa e efeito) → perfis (exploração livre).

## 7. Números para saber de cor

- Mundo, 2000 → 2024:
  - quota renovável de 19% para 32%;
  - solar + eólica de 0,2% para 15%;
  - geração de cerca de 15.300 para 30.900 TWh (duplicou);
  - emissões de 8,1 para 14,6 GtCO₂e (cerca de +80%).
- Crescimento 2000 → 2024:
  - procura nova: 15.651 TWh;
  - baixo carbono novo: 7.255 TWh (cobriu cerca de 46%);
  - fósseis: +8.397 TWh.
- Decomposição do mundo: efeito procura +7,8 Gt, efeito mix −1,2 Gt, total +6,5 GtCO₂e.
- Quota renovável:
  - Alemanha de 6% para 59%;
  - Reino Unido de 3% para 51%;
  - Espanha de 16% para 57%;
  - Filipinas de 43% para 20% (contra a tendência).
- Dataset:
  - OWID Energy, CC BY 4.0;
  - 16 das 130 variáveis;
  - cerca de 6.600 linhas, 214 países, 1985–2025;
  - emissões só a partir de 2000.

## 8. Perguntas prováveis

- **Porquê só eletricidade?** Veja-se a secção 2: é a única família com dados por fonte para quase
  todos os países, e tem emissões próprias.
- **Porquê um globo, se só mostra metade do mundo?** É mais envolvente do que o mapa plano
  que o OWID já tem. Para compensar, há rotação, pesquisa e um botão para o mapa plano.
- **O Marimekko e a View 4 não mostram o mesmo?** Não. O Marimekko mostra de que é feita a
  eletricidade (o estado). A View 4 mostra se o crescimento limpo chega para a procura e
  porque mudaram as emissões (o balanço). O Marimekko não mostra emissões.
- **Porquê um radar, se tem problemas conhecidos?** É a única view que compara poucos países
  em muitas medidas ao mesmo tempo. Mitigamos os problemas com poucos eixos, ordem fixa,
  preenchimento leve e valores exatos ao passar o rato.
- **Porque é que as emissões só aparecem a partir de 2000?** Antes disso o dataset não tem
  emissões. Essas views mostram um aviso para os anos anteriores.
- **O radar usa Observable Plot?** O exemplo base sim. Planeamos fazê-lo em D3; se usarmos o
  Plot, falamos primeiro com os professores, como pede o enunciado.
