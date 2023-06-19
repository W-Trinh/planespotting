
async function collect_neighborhoods() {
    const response = await fetch('https://data.toulouse-metropole.fr/api/records/1.0/search/?dataset=recensement-population-2019-grands-quartiers-population&q=&rows=61');
    const myJson = await response.json(); 

    const data = [];

    myJson["records"].forEach(quartier =>{
            const res = format_neighborhoods(quartier)
            data.push(res)
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