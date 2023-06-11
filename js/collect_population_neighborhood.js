
async function collect_neighborhoods() {
    const response = await fetch('https://data.toulouse-metropole.fr/api/records/1.0/search/?dataset=recensement-population-2019-grands-quartiers-population&q=&rows=61');
    const myJson = await response.json(); 

    const data = [];

    myJson["records"].forEach(quartier =>{
            const poly = []
            for (const tabPoint of quartier["fields"]["geo_shape"]["coordinates"]){
                for (const point of tabPoint){
                    const np = []
                    np.push(point[1],point[0])
                    poly.push(np)
                }
            }

            data.push({
                "quartier": quartier["fields"]["lib_grd_quart"],
                "population": Math.floor(quartier["fields"]["p19_pop"]),
                "point":quartier["fields"]["geo_point_2d"],
                "polygon":poly,
            })
        }
    )
    return data
}

async function draw_neighborhood(){
    NEIGHBORHOODS.forEach(quartier =>{
        const percent = percent_on_range(quartier["population"], POPULATION_RANGE[0], POPULATION_RANGE[1])
        L.polygon(
            quartier["polygon"],
            {color: NEIGHBORHOODS_GRADIENT[ Math.floor(percent) ], opacity: 0.8}
            )
            .bindPopup(quartier["quartier"] + " : " + quartier["population"])
            .addTo(nbgh_pop);
    }
    )
}