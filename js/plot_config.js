var plot_holder = "#telemetry_graph .holder";
var plot_options = {
    crosshair: {
        mode: "x"
    },
    legend: {
        show: true,
        sorted: false,
        position: 'nw',
        noColumns: 1,
        backgroundColor: null,
        backgroundOpacity: 0
    },
    grid: {
        show: true,
        hoverable: true,
        aboveData: true,
        borderWidth: 0,
    },
    selection: {
        mode: "x"
    },
    yaxes: [
        {show: false, min: 0 },
        {show: false, min: 0 },
        {show: false, min: 0 },
        {show: false, min: 0 },
        {show: false, min: 0 },
        {show: false, min: 0 },
        {show: false, min: 0 },
        {show: false, min: 0 },
        {show: false, min: 0 },
    ],
    xaxes: [
        {
            show: true,
            mode: "time",
            timeformat: "%H:%M"
        }
    ]
};

// init plot
plot = $.plot(plot_holder, {}, plot_options);
var updateLegendTimeout = null;
var latestPosition = null;
var polyMarker = null;

// updates legend with extrapolated values under the mouse position
function updateLegend() {
    var legend = $(plot_holder + " .legendLabel");
    $(plot_holder + " .legend table").css({'background-color':"rgba(255,255,255,0.9)"});
    legend.each(function() {
        $(this).css({'padding-left':'3px'});
    });

    updateLegendTimeout = null;

    var pos = latestPosition;

    var axes = plot.getAxes();
    if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max ||
        pos.y < axes.yaxis.min || pos.y > axes.yaxis.max) {
        return;
    }

    var i, j, dataset = plot.getData();
    for (i = 0; i < dataset.length; ++i) {

        var series = dataset[i];

        // Find the nearest points, x-wise

        for (j = 0; j < series.data.length; ++j) {
            if (series.data[j][0] > pos.x) {
                break;
            }
        }

        var y;
        if(series.noInterpolate > 0) { y = series.data[((j==0)?j:j-1)][1]; }
        else {
            var p1 = (j==0) ? null : series.data[j-1];
                p2 = series.data[j];

            if (p1 == null) {
                y = p2[1];
            } else if (p2 == null) {
                y = p1[1];
            } else {
                y = p1[1] + (p2[1] - p1[1]) * (pos.x - p1[0]) / (p2[0] - p1[0]);
            }
            y = y.toFixed(2);

            if((p1 && p1[1] == null) || (p2 && p2[1] == null)) y = null;
        }
        legend.eq(i).text(series.label.replace(/=.*/, "= " + y));
    }

    if(!polyMarker) {
        polyMarker = new google.maps.Marker({
            clickable: false,
            flat: true,
            map: map,
            visible: true,
            icon: null
        });
    }

    if(follow_vehicle != -1 && vehicles[follow_vehicle].positions.length) {
        // adjust index for null data points
        j = j - vehicles[follow_vehicle].graph_data[0].nulls;
        // update position
        polyMarker.setPosition(vehicles[follow_vehicle].positions[j]);
    }
}

// update legend values on mouse hover
$(plot_holder).bind("plothover",  function (event, pos, item) {
    latestPosition = pos;
    plot.lockCrosshair();
    plot.setCrosshair(pos);
    if (!updateLegendTimeout) {
        updateLegendTimeout = setTimeout(updateLegend, 50);
    }
});

// double click on the plot clears selection
$(plot_holder).bind("dblclick", function () {
    if(plot_options.xaxis) delete plot_options.xaxis;
    plot = $.plot("#telemetry_graph .holder", plot.getData(), plot_options);
});

// limit range after selection
$(plot_holder).bind("plotselected", function (event, ranges) {
    plot = $.plot("#telemetry_graph .holder", plot.getData(), $.extend(true, plot_options, {
        xaxis: {
            min: ranges.xaxis.from,
            max: ranges.xaxis.to
        }
    }));
});
