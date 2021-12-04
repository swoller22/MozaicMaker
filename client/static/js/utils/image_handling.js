/**
 * Process and display a mozaic based on the input form data
 */
async function processAndDisplayMozaic(e) {

  e.preventDefault();

  // Retrieve input form data
  let smallImageFiles = $("#smallImageFiles").prop('files')
  let largeImageFile = $("#largeImageFile").prop('files')[0]
  let largeImageWidth = $("#largeImageWidth").val()
  let largeImageHeight = $("#largeImageHeight").val()

  // Do nothing if the input information is invalid
  if (smallImageFiles.length == 0 ||
    largeImageFile == undefined ||
    largeImageWidth == "" ||
    largeImageHeight == "") {

    return
  }

  /**
   * Create multipart/form-data object for back-end processing
   */
  let formData = new FormData()

  formData.append('largeImageFile', largeImageFile)
  Array.from(smallImageFiles).forEach(smallImageFile => {

    formData.append('smallImageFiles', smallImageFile)
  })

  formData.append('largeImageWidth', largeImageWidth)
  formData.append('largeImageHeight', largeImageHeight)
  formData.append('smallImageSize', $("#smallImageSize").val())

  let algorithm = $("input[name='btnradio']:checked", '#photoImportForm').val()
  formData.append('algorithm', algorithm)

  /**
   * Algorithm-dependant config data
   */
  if (algorithm == "rgb" || algorithm == "hsv") {
    formData.append('climbDistance', $('#climbDistance').val())
  }

  if (algorithm == "hsv") {
    formData.append('numberOfClimbers', $('#nClimbers').val())
  }

  const result = await axios.post('http://localhost:5000/image_processing', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  var img = $("#myImage").get(0)
  img.src = 'data:image/png;base64,' + result.data.data

  $("#averageDistance").text(`Average Distance: ${result.data.matchInfo.averageDistance}`)
  $("#worstDistance").text(`Worst Distance: ${result.data.matchInfo.worstDistance}`)

  console.log(result.data.matchInfo)
}

/**
 * Get image data for analysis and output the information
 */
async function getImageData(e) {

  e.preventDefault();

  // Retrieve input form data
  let smallImageFiles = $("#smallImageFiles").prop('files')
  let largeImageFile = $("#largeImageFile").prop('files')[0]
  let largeImageWidth = $("#largeImageWidth").val()
  let largeImageHeight = $("#largeImageHeight").val()

  // Do nothing if the input information is invalid
  if (smallImageFiles.length == 0 ||
    largeImageFile == undefined ||
    largeImageWidth == "" ||
    largeImageHeight == "") {

    return
  }

  /**
   * Create multipart/form-data object for back-end processing
   */
  let formData = new FormData()

  formData.append('largeImageFile', largeImageFile)
  Array.from(smallImageFiles).forEach(smallImageFile => {

    formData.append('smallImageFiles', smallImageFile)
  })
  formData.append('largeImageWidth', largeImageWidth)
  formData.append('largeImageHeight', largeImageHeight)
  formData.append('smallImageSize', $("#smallImageSize").val())
  const result = await axios.post('http://localhost:5000/image_processing/analysis', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  /**
   * Put rgb data into a format for display
   */
  let reconstructedSmallImageRGBs = []
  for (let i = 0; i < result.data.smallImageAverages.R.length; i++) {
    reconstructedSmallImageRGBs.push(`rgb(${result.data.smallImageAverages.R[i]},${result.data.smallImageAverages.G[i]},${result.data.smallImageAverages.B[i]})`)
  }
  let reconstructedLargeImageRGBs = []
  for (let i = 0; i < result.data.blockAverages.R.length; i++) {
    reconstructedLargeImageRGBs.push(`rgb(${result.data.blockAverages.R[i]},${result.data.blockAverages.G[i]},${result.data.blockAverages.B[i]})`)
  }

  /**
   * Create traces for small image color-space and block average color-space
   */
  var smallImageTrace = {
    x: result.data.smallImageAverages.R, y: result.data.smallImageAverages.G, z: result.data.smallImageAverages.B,
    mode: 'markers',
    name: 'Small Images',
    marker: {
      color: reconstructedSmallImageRGBs,
      size: 12,
      symbol: 'circle',
      line: {
        color: 'rgb(204, 204, 204)',
        width: 1
      },
      opacity: 0.8
    },
    type: 'scatter3d'
  };
  var largeImageTrace = {
    x: result.data.blockAverages.R, y: result.data.blockAverages.G, z: result.data.blockAverages.B,
    mode: 'markers',
    name: 'Large Image Blocks',
    marker: {
      color: reconstructedLargeImageRGBs,
      size: 12,
      symbol: 'circle',
      line: {
        color: 'rgb(204, 204, 204)',
        width: 1
      },
      opacity: 0.8
    },
    type: 'scatter3d'
  };
  let range = [0, 256]
  let smallImageData = [smallImageTrace]
  let largeImageData = [largeImageTrace]
  var layout = {
    title: "Hello",
    scene: {
      xaxis: { title: 'R', range },
      yaxis: { title: 'G', range },
      zaxis: { title: 'B', range }
    },
    margin: {
      l: 0,
      r: 0,
      b: 0,
      t: 0
    }
  }
  Plotly.newPlot('smallImagesAnalysisPlot', smallImageData, layout);
  Plotly.newPlot('largeImageAnalysisPlot', largeImageData, layout);
  $('#colorspacePlotContainer > div').css("border", "2px solid black")
  $('#colorspacePlotContainer h6').css("display", "block")

  // Plot the sorted data
  var hsvTrace = {
    y: new Array(result.data.sortedData.hsvSorted.length).fill(7),
    text: result.data.sortedData.hsvSorted,
    mode: 'markers',
    marker: {
      size: 40,
      color: result.data.sortedData.hsvSorted
    }
  }

  var rgbTrace = {
    y: new Array(result.data.sortedData.hsvSorted.length).fill(6),
    text: result.data.sortedData.rgbSorted,
    mode: 'markers',
    marker: {
      size: 40,
      color: result.data.sortedData.rgbSorted
    }
  }

  var rbgTrace = {
    y: new Array(result.data.sortedData.hsvSorted.length).fill(5),
    text: result.data.sortedData.rbgSorted,
    mode: 'markers',
    marker: {
      size: 40,
      color: result.data.sortedData.rbgSorted
    }
  }

  var grbTrace = {
    y: new Array(result.data.sortedData.hsvSorted.length).fill(4),
    text: result.data.sortedData.grbSorted,
    mode: 'markers',
    marker: {
      size: 40,
      color: result.data.sortedData.grbSorted
    }
  }

  var gbrTrace = {
    y: new Array(result.data.sortedData.hsvSorted.length).fill(3),
    text: result.data.sortedData.gbrSorted,
    mode: 'markers',
    marker: {
      size: 40,
      color: result.data.sortedData.gbrSorted
    }
  }

  var brgTrace = {
    y: new Array(result.data.sortedData.hsvSorted.length).fill(2),
    text: result.data.sortedData.brgSorted,
    mode: 'markers',
    marker: {
      size: 40,
      color: result.data.sortedData.brgSorted
    }
  }

  var bgrTrace = {
    y: new Array(result.data.sortedData.hsvSorted.length).fill(1),
    text: result.data.sortedData.bgrSorted,
    mode: 'markers',
    marker: {
      size: 40,
      color: result.data.sortedData.bgrSorted
    }
  }

  var data = [hsvTrace, rgbTrace, rbgTrace, grbTrace, gbrTrace, brgTrace, bgrTrace];

  var layout = {
    showlegend: false,
    title: 'Sorted colors',
    yaxis: {
      tickmode: "array",
      tickvals: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      ticktext: ["", "HSV", "RGB", "RBG", "GRB", "GBR", "BRG", "BGR", ""].reverse()
    }
  };

  Plotly.newPlot('sortedColorSpace', data, layout);
}

export { processAndDisplayMozaic, getImageData }