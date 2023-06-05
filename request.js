async function getPop() {
    const response = await fetch('https://data.toulouse-metropole.fr/api/records/1.0/search/?dataset=recensement-population-2019-grands-quartiers-population&q=');
    const myJson = await response.json(); 

    const data = [];

    myJson["records"].forEach(quartier =>
        data.push({
            "quartier": quartier["fields"]["lib_grd_quart"],
            "population": quartier["fields"]["p19_pop"]
        })
        )

    console.log(data)
}
