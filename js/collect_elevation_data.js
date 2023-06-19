const LAT_MIN = 43.463671
const LAT_MAX = 43.774814
const LON_MIN = 1.076765
const LON_MAX = 1.632497
const NB_SAMPLE = 3000
const SAMPLE_DIST_LAT = ( LAT_MAX - LAT_MIN ) / NB_SAMPLE
const SAMPLE_DIST_LON = ( LON_MAX - LON_MIN ) / NB_SAMPLE

let lowest_alt  = 1000;
let highest_alt = 0;

/* struct :
    {
        index : int
        {
            lat    : float,
            from   : float,
            to     : float
            points : 
                [
                    [float, float, float]
                    ...
                ] 
        }
    }
*/
let elevation_dataset  = {}
let index_error_503    = []
let fetch_resume_table = {}

async function compose_elevation_rows(from=0,to=NB_SAMPLE) {
    let Promises_responses = 0 

    for (let index = from; index < to; index++) {
        
        //latitude de la ligne actuelle
        let lat = LAT_MIN + SAMPLE_DIST_LAT*index
        //si déjà dans le dataset elevation_dataset
        if (index in elevation_dataset) continue
        //console.log("for : " + index)

        fetch('https://wxs.ign.fr/calcul/alti/rest/elevationLine.json?sampling=1000&lon='+ LON_MIN +'|'+ LON_MAX +'&lat='+ lat +'|'+ lat +'&indent=true')
            .then( response => response.json() )
            .then( data => 
                {
                    Promises_responses++

                    //init tableau temp de recup des points
                    let tmp_points = []

                    for (const value of data["elevations"]) {
                        var alti = parseFloat(value["z"])
                        var percent = parseInt(Math.floor(((alti - 50) * 100) / (400 - 50)))
                        tmp_points.push(
                            [
                                parseFloat(value["lat"]), 
                                parseFloat(value["lon"]),
                                percent
                            ]
                        )
                    } 

                    elevation_dataset[index] = 
                        {
                            lat    : lat,
                            from   : LON_MIN,
                            to     : LON_MAX,
                            points : [...tmp_points]
                        }

                    fetch_resume_table[index] = {id: index, status: "ok", message: "bien récuperé"}
                }
            ).catch( (err) => {
                    Promises_responses++
                    //console.log("reponse nok pour : " + index) 
                    fetch_resume_table[index] = {id: index, status: "not ok", message: err.toString() }
                    //console.log(err)
                }
            )
    }

    //on attend toutes les réponses
    let waited_for = 0
    while( Promises_responses < to-from-1 && waited_for <= MAX_LOOP_ALLOWED ) {
        // for (const [key, value] of Object.entries(fetch_resume_table)) {
        //     if (value["message"].contains("Unexpected")) {
        //         temp_table_err.push(value)                
        //     }
        // }
        //console.log("we wait now")
        waited_for++
        await sleep(3000)
    }
}

function fect_per_index(index) {
    let lat = LAT_MIN + SAMPLE_DIST_LAT*index
    fetch('https://wxs.ign.fr/calcul/alti/rest/elevationLine.json?sampling=100&lon='+ LON_MIN +'|'+ LON_MAX +'&lat='+ lat +'|'+ lat +'&indent=true')
            .then( response => response.json() )
            .then( data => 
                {
                    Promises_responses++

                    //init tableau temp de recup des points
                    let tmp_points = []

                    for (const value of data["elevations"]) {
                        var alti = parseFloat(value["z"])
                        var percent = parseInt(Math.floor(((alti - 50) * 100) / (400 - 50)))
                        tmp_points.push(
                            [
                                parseFloat(value["lat"]), 
                                parseFloat(value["lon"]),
                                alti
                            ]
                        )
                    } 

                    elevation_dataset.push(
                        {
                            lat    : lat,
                            from   : LON_MIN,
                            to     : LON_MAX,
                            points : [...tmp_points]
                        }
                    )

                    fetch_resume_table[index] = {id: index, status: "ok", message: "bien récuperé"}
                }
            ).catch( (err) => {
                    Promises_responses++
                    //console.log("reponse nok pour : " + index) 
                    fetch_resume_table[index] = {id: index, status: "not ok", message: err }
                    //console.log(err)
                }
            )
}

function in_elevation_rows(lat) {
    for (const row of elevation_dataset) {
        if (row["lat"] == lat) return true
    }
    return false
}

async function gather_geo_data(from=0, to=NB_SAMPLE) {
    elevation_dataset = {}
    let ranges = [
        [0   , 500 ],
        [500 , 1000],
        [1000, 1500],
        [1500, 2000],
        [2000, 2500],
        [2500, 3000]
    ]

    for (const range of ranges) {
        await compose_elevation_rows(range[0],range[1])
        let temp_table_err = []
        for (const [key, value] of Object.entries(fetch_resume_table)) {
            if (value["status"] === "not ok") {
                temp_table_err.push(value) 
                if (!value["message"].includes("Unexpected end of JSON")) {
                    index_error_503.push(value["id"])                
                }               
            }
        }
        console.table(temp_table_err)
        console.log("successes : " + Object.keys(elevation_dataset).length + " | failures : " + (to-Object.keys(elevation_dataset).length))
    }

    console.log("C'EST FINI")
}


