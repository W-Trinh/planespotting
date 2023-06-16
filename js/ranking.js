function mark_green_spaces(green_spaces, neighborhoods){
    green_spaces.forEach(park => {
        if(park.green_space.fields.surface_m2 > 100){
            neighborhoods.forEach(neighborhood => { 
                try{
                    let lat = Math.min(park.center_most_point[1], park.center_most_point[0])
                    let lon = Math.max(park.center_most_point[1], park.center_most_point[0])
                    const actualCenter = [lon,lat]
                    if(inside_polygon(actualCenter, neighborhood.polygon)) {
                        console.log("--------------TROUVE--------------")
                        const note = Math.floor(100 - (neighborhood.population/31230) * 100)
                        L.marker(actualCenter).bindPopup("Note :" + note + "/100").addTo(map)
                    }
                }
                catch{
                    //console.log("ccasé")
                }
            })
        }
    })
}
