function format_green_spaces (record, polygon_data) {
    avg_altitude = polygon_data["average_altitude"]
    sampled_points = polygon_data["sampled_points"]
    center_most_point = polygon_data["center"]
    return {
        green_space: record,
        avg_altitude: avg_altitude,
        sampled_points: sampled_points,
        center_most_point : center_most_point,
        surface : record.fields.surface_m2
    }
}

function format_neighborhoods (quartier) {
    let poly = []
    for (const tabPoint of quartier["fields"]["geo_shape"]["coordinates"]){
        for (const point of tabPoint){
            const np = []
            np.push(point[1],point[0])
            poly.push(np)
        }
    }

    return {
        "quartier": quartier["fields"]["lib_grd_quart"],
        "population": Math.floor(quartier["fields"]["p19_pop"]),
        "point":quartier["fields"]["geo_point_2d"],
        "polygon":poly,
    }
}