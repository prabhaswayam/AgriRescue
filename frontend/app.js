/* =========================================================
   AGRIRESCUE v0.3
   Farmer Decision Support Prototype

   Prototype only:
   - Demo destination data
   - No live market prices
   - No live maps
   - No real-time availability
   - No AI/ML yet
========================================================= */


/* =========================================================
   1. DEMO DATA
========================================================= */

const sellDestinations = [
    {
        name: "FreshKart Buyer",
        type: "Buyer",
        distance: 8,
        price: 20,
        capacity: 800,
        accepts: ["high", "medium"],
        payment: "Immediate"
    },

    {
        name: "City Wholesale Market",
        type: "Wholesale Market",
        distance: 25,
        price: 22,
        capacity: 1000,
        accepts: ["high", "medium"],
        payment: "Same-day"
    },

    {
        name: "Local Tomato Trader",
        type: "Local Trader",
        distance: 5,
        price: 17,
        capacity: 300,
        accepts: ["medium", "low"],
        payment: "Immediate"
    },

    {
        name: "Nearby Vegetable Buyer",
        type: "Buyer",
        distance: 15,
        price: 19,
        capacity: 1200,
        accepts: ["high", "medium", "low"],
        payment: "Same-day"
    }
];


const storageDestinations = [
    {
        name: "Local Cold Storage",
        distance: 6,
        capacity: 1000,
        dailyCost: 2.5,
        suitable: ["high", "medium"]
    },

    {
        name: "Agri Storage Centre",
        distance: 14,
        capacity: 2000,
        dailyCost: 1.8,
        suitable: ["high", "medium", "low"]
    },

    {
        name: "Farmer Cooperative Storage",
        distance: 20,
        capacity: 3000,
        dailyCost: 1.5,
        suitable: ["high", "medium"]
    }
];


const processDestinations = [
    {
        name: "Pune Fresh Processor",
        type: "Processing Company",
        distance: 12,
        buyPrice: 18,
        capacity: 1500,
        accepts: ["high", "medium", "low"],
        product: "Processed tomato products"
    },

    {
        name: "Tomato Processing Unit",
        type: "Processing Company",
        distance: 18,
        buyPrice: 19,
        capacity: 2000,
        accepts: ["medium", "low"],
        product: "Puree / sauce"
    },

    {
        name: "Local Food Processing Centre",
        type: "Processing Company",
        distance: 10,
        buyPrice: 16,
        capacity: 1000,
        accepts: ["high", "medium", "low"],
        product: "Chutney / puree"
    }
];


const selfProcessOptions = [
    {
        name: "Small Tomato Chutney Unit",
        distance: 7,
        capacity: 1000,
        yieldRatio: 0.70,
        processingCost: 8,
        sellingPrice: 70,
        product: "Tomato chutney",
        suitable: ["high", "medium"]
    },

    {
        name: "Local Tomato Puree Unit",
        distance: 11,
        capacity: 1500,
        yieldRatio: 0.60,
        processingCost: 6,
        sellingPrice: 55,
        product: "Tomato puree",
        suitable: ["high", "medium", "low"]
    }
];


/* =========================================================
   2. BASIC HELPERS
========================================================= */

function money(value) {

    return "₹" +
        Math.round(value).toLocaleString("en-IN");
}


function number(value) {

    return Number(value) || 0;
}


function qualityLabel(value) {

    const labels = {
        high: "High",
        medium: "Medium",
        low: "Low"
    };

    return labels[value] || value;
}


function urgencyLabel(value) {

    const labels = {
        low: "Low",
        medium: "Medium",
        high: "High",
        critical: "Critical"
    };

    return labels[value] || value;
}


function qualityAccepted(acceptedQualities, quality) {

    return acceptedQualities.includes(quality);
}


/* =========================================================
   3. SELL CALCULATION
========================================================= */

function calculateSellOptions(
    quantity,
    quality,
    transportRate,
    maxDistance
) {

    return sellDestinations

        .filter(destination =>

            destination.distance <= maxDistance &&

            destination.capacity >= quantity &&

            qualityAccepted(
                destination.accepts,
                quality
            )
        )

        .map(destination => {

            const grossValue =
                quantity * destination.price;

            const transportCost =
                destination.distance * transportRate;

            const netRealization =
                grossValue - transportCost;

            return {

                ...destination,

                action: "SELL",

                grossValue,

                transportCost,

                netRealization
            };
        })

        .sort(
            (a, b) =>
                b.netRealization -
                a.netRealization
        );
}


/* =========================================================
   4. STORAGE CALCULATION
========================================================= */

function calculateStorageOptions(
    quantity,
    quality,
    transportRate,
    maxDistance,
    futurePrice,
    storageDays
) {

    return storageDestinations

        .filter(destination =>

            destination.distance <= maxDistance &&

            destination.capacity >= quantity &&

            destination.suitable.includes(quality)
        )

        .map(destination => {

            const futureGross =
                quantity * futurePrice;

            const transportCost =
                destination.distance *
                transportRate;

            const storageCost =
                quantity *
                destination.dailyCost *
                storageDays;

            const netRealization =
                futureGross -
                transportCost -
                storageCost;

            return {

                ...destination,

                action: "STORE",

                futureGross,

                transportCost,

                storageCost,

                netRealization,

                futurePrice,

                storageDays
            };
        })

        .sort(
            (a, b) =>
                b.netRealization -
                a.netRealization
        );
}


/* =========================================================
   5. PROCESSING COMPANY CALCULATION
========================================================= */

function calculateProcessCompanyOptions(
    quantity,
    quality,
    transportRate,
    maxDistance
) {

    return processDestinations

        .filter(destination =>

            destination.distance <= maxDistance &&

            destination.capacity >= quantity &&

            qualityAccepted(
                destination.accepts,
                quality
            )
        )

        .map(destination => {

            const grossValue =
                quantity * destination.buyPrice;

            const transportCost =
                destination.distance *
                transportRate;

            const netRealization =
                grossValue -
                transportCost;

            return {

                ...destination,

                action: "PROCESS",

                mode: "company",

                grossValue,

                transportCost,

                netRealization
            };
        })

        .sort(
            (a, b) =>
                b.netRealization -
                a.netRealization
        );
}


/* =========================================================
   6. SELF PROCESSING CALCULATION
========================================================= */

function calculateSelfProcessOptions(
    quantity,
    quality,
    transportRate,
    maxDistance
) {

    return selfProcessOptions

        .filter(option =>

            option.distance <= maxDistance &&

            option.capacity >= quantity &&

            option.suitable.includes(quality)
        )

        .map(option => {

            const outputQuantity =
                quantity * option.yieldRatio;

            const grossValue =
                outputQuantity *
                option.sellingPrice;

            const processingCost =
                quantity *
                option.processingCost;

            const transportCost =
                option.distance *
                transportRate;

            const netRealization =
                grossValue -
                processingCost -
                transportCost;

            return {

                ...option,

                action: "PROCESS",

                mode: "self",

                outputQuantity,

                grossValue,

                processingCost,

                transportCost,

                netRealization
            };
        })

        .sort(
            (a, b) =>
                b.netRealization -
                a.netRealization
        );
}


/* =========================================================
   7. MAIN ACTION RANKING
========================================================= */

function rankMainActions(
    sellOptions,
    storageOptions,
    processOptions,
    urgency
) {

    const actions = [];


    if (sellOptions.length > 0) {

        actions.push({

            action: "SELL",

            title: "Sell",

            icon: "💰",

            best: sellOptions[0],

            netRealization:
                sellOptions[0].netRealization
        });
    }


    if (storageOptions.length > 0) {

        actions.push({

            action: "STORE",

            title: "Store",

            icon: "🏪",

            best: storageOptions[0],

            netRealization:
                storageOptions[0].netRealization
        });
    }


    if (processOptions.length > 0) {

        actions.push({

            action: "PROCESS",

            title: "Process",

            icon: "🏭",

            best: processOptions[0],

            netRealization:
                processOptions[0].netRealization
        });
    }


    actions.sort(
        (a, b) =>
            b.netRealization -
            a.netRealization
    );


    /*
       Prototype urgency safeguard.

       If urgency is critical, we avoid recommending
       storage when a quick sell/process option is
       within 5% of the storage estimate.
    */

    if (

        urgency === "critical" &&

        actions.length > 1 &&

        actions[0].action === "STORE"

    ) {

        const bestStore = actions[0];


        const quickActions = actions

            .filter(item =>

                item.action === "SELL" ||

                item.action === "PROCESS"
            )

            .sort(
                (a, b) =>
                    b.netRealization -
                    a.netRealization
            );


        if (quickActions.length > 0) {

            const bestQuick =
                quickActions[0];


            if (

                bestQuick.netRealization >=

                bestStore.netRealization *
                0.95

            ) {

                actions.splice(
                    actions.indexOf(bestQuick),
                    1
                );

                actions.unshift(bestQuick);
            }
        }
    }


    return actions;
}


/* =========================================================
   8. RECOMMENDATION REASON
========================================================= */

function recommendationReason(
    action,
    best,
    urgency,
    quantity
) {

    if (!best) {

        return "No suitable option was found with the current prototype data.";
    }


    const reasons = [];


    if (action === "SELL") {

        reasons.push(
            `${best.name} offers ${money(best.price)}/kg.`
        );

        reasons.push(
            `Estimated net realization is ${money(best.netRealization)}.`
        );

        reasons.push(
            `It is approximately ${best.distance} km away.`
        );
    }


    if (action === "STORE") {

        reasons.push(
            `${best.name} can accommodate your ${quantity} kg lot.`
        );

        reasons.push(
            `Estimated storage cost is ${money(best.storageCost)}.`
        );

        reasons.push(
            `Estimated net realization after storage is ${money(best.netRealization)}.`
        );
    }


    if (action === "PROCESS") {

        if (best.mode === "company") {

            reasons.push(
                `${best.name} is shown as a processing buyer.`
            );

            reasons.push(
                `Indicative buying price is ${money(best.buyPrice)}/kg.`
            );

        } else {

            reasons.push(
                `${best.name} is a self-processing option.`
            );

            reasons.push(
                `Estimated output is ${Math.round(best.outputQuantity)} kg.`
            );
        }


        reasons.push(
            `Estimated net realization is ${money(best.netRealization)}.`
        );
    }


    if (

        urgency === "high" ||

        urgency === "critical"

    ) {

        reasons.push(
            "Because urgency is high, avoid unnecessary delay."
        );
    }


    return reasons
        .slice(0, 3)
        .join(" ");
}


/* =========================================================
   9. OPTION CARD
========================================================= */

function createOptionCard(
    option,
    rank,
    action
) {

    let details = "";


    /* SELL */

    if (action === "SELL") {

        details = `

            <div class="option-detail">

                <span>Price</span>

                <strong>
                    ${money(option.price)}/kg
                </strong>

            </div>


            <div class="option-detail">

                <span>Distance</span>

                <strong>
                    ${option.distance} km
                </strong>

            </div>


            <div class="option-detail">

                <span>Transport</span>

                <strong>
                    ${money(option.transportCost)}
                </strong>

            </div>


            <div class="option-detail">

                <span>Gross value</span>

                <strong>
                    ${money(option.grossValue)}
                </strong>

            </div>
        `;
    }


    /* STORE */

    if (action === "STORE") {

        details = `

            <div class="option-detail">

                <span>Distance</span>

                <strong>
                    ${option.distance} km
                </strong>

            </div>


            <div class="option-detail">

                <span>Storage/day</span>

                <strong>
                    ${money(option.dailyCost)}/kg
                </strong>

            </div>


            <div class="option-detail">

                <span>Storage cost</span>

                <strong>
                    ${money(option.storageCost)}
                </strong>

            </div>


            <div class="option-detail">

                <span>Future price</span>

                <strong>
                    ${money(option.futurePrice)}/kg
                </strong>

            </div>
        `;
    }


    /* PROCESS */

    if (action === "PROCESS") {

        if (option.mode === "company") {

            details = `

                <div class="option-detail">

                    <span>Buying price</span>

                    <strong>
                        ${money(option.buyPrice)}/kg
                    </strong>

                </div>


                <div class="option-detail">

                    <span>Distance</span>

                    <strong>
                        ${option.distance} km
                    </strong>

                </div>


                <div class="option-detail">

                    <span>Transport</span>

                    <strong>
                        ${money(option.transportCost)}
                    </strong>

                </div>


                <div class="option-detail">

                    <span>Output</span>

                    <strong>
                        ${option.product}
                    </strong>

                </div>
            `;

        } else {

            details = `

                <div class="option-detail">

                    <span>Product</span>

                    <strong>
                        ${option.product}
                    </strong>

                </div>


                <div class="option-detail">

                    <span>Distance</span>

                    <strong>
                        ${option.distance} km
                    </strong>

                </div>


                <div class="option-detail">

                    <span>Processing cost</span>

                    <strong>
                        ${money(option.processingCost)}
                    </strong>

                </div>


                <div class="option-detail">

                    <span>Estimated output</span>

                    <strong>
                        ${Math.round(option.outputQuantity)} kg
                    </strong>

                </div>
            `;
        }
    }


    return `

        <article class="option-card">


            <div class="option-top">


                <div class="rank-badge">

                    #${rank}

                </div>


                <div class="option-title">

                    <h3>
                        ${option.name}
                    </h3>


                    <p>

                        ${
                            action === "PROCESS" &&
                            option.mode === "self"

                                ? "Self-processing / value addition"

                                : option.type || action
                        }

                    </p>

                </div>


                <div class="option-net">

                    <span>
                        Expected net
                    </span>


                    <strong>
                        ${money(option.netRealization)}
                    </strong>

                </div>


            </div>


            <div class="option-details">

                ${details}

            </div>


        </article>
    `;
}


/* =========================================================
   10. ACTION SECTION
========================================================= */

function createActionSection(
    action,
    title,
    icon,
    options
) {

    if (!options || options.length === 0) {

        return `

            <section class="card action-section">


                <div class="section-header">

                    <div class="section-icon">
                        ${icon}
                    </div>


                    <div>

                        <h2>
                            ${title}
                        </h2>

                        <p>
                            No suitable option found.
                        </p>

                    </div>

                </div>


                <div class="empty-state">

                    No demo option matches the
                    quantity, quality and distance
                    you entered.

                </div>


            </section>
        `;
    }


    return `

        <section class="card action-section">


            <div class="section-header">


                <div class="section-icon">

                    ${icon}

                </div>


                <div>

                    <h2>
                        ${title}
                    </h2>


                    <p>

                        Top
                        ${Math.min(options.length, 3)}
                        available options

                    </p>

                </div>


            </div>


            <div class="options-list">

                ${

                    options

                        .slice(0, 3)

                        .map(
                            (option, index) =>

                                createOptionCard(

                                    option,

                                    index + 1,

                                    action
                                )
                        )

                        .join("")
                }

            </div>


        </section>
    `;
}


/* =========================================================
   11. MAIN RECOMMENDATION
========================================================= */

function createMainRecommendation(
    rankedActions,
    quantity,
    urgency
) {

    if (!rankedActions.length) {

        return `

            <section class="card recommendation-card">


                <div class="recommendation-label">

                    NO SUITABLE OPTION FOUND

                </div>


                <h2>

                    We could not find
                    a matching rescue option.

                </h2>


                <p>

                    Try increasing the maximum
                    travel distance or checking
                    the crop quality and quantity.

                </p>


            </section>
        `;
    }


    const first =
        rankedActions[0];

    const best =
        first.best;


    return `

        <section class="card recommendation-card">


            <div class="recommendation-label">

                #1 RECOMMENDED ACTION

            </div>


            <div class="recommendation-main">


                <div class="recommendation-icon">

                    ${first.icon}

                </div>


                <div>

                    <h2>
                        ${first.title}
                    </h2>


                    <p class="recommendation-subtitle">

                        Based on the current
                        prototype estimates

                    </p>

                </div>


            </div>


            <div class="recommendation-destination">


                <div>

                    <span class="small-label">

                        BEST MATCH

                    </span>


                    <h3>

                        ${best.name}

                    </h3>


                    <p>

                        ${best.distance} km away

                    </p>

                </div>


                <div class="recommendation-net">

                    <span>

                        Expected net realization

                    </span>


                    <strong>

                        ${money(
                            best.netRealization
                        )}

                    </strong>

                </div>


            </div>


            <div class="recommendation-details">

                ${createRecommendationDetails(
                    first.action,
                    best
                )}

            </div>


            <div class="why-best">


                <strong>

                    Why this is #1

                </strong>


                <p>

                    ${recommendationReason(
                        first.action,
                        best,
                        urgency,
                        quantity
                    )}

                </p>


            </div>


        </section>
    `;
}


/* =========================================================
   12. RECOMMENDATION DETAILS
========================================================= */

function createRecommendationDetails(
    action,
    best
) {

    if (action === "SELL") {

        return `

            <div>

                <span>
                    Price
                </span>

                <strong>
                    ${money(best.price)}/kg
                </strong>

            </div>


            <div>

                <span>
                    Gross value
                </span>

                <strong>
                    ${money(best.grossValue)}
                </strong>

            </div>


            <div>

                <span>
                    Transport cost
                </span>

                <strong>
                    ${money(best.transportCost)}
                </strong>

            </div>


            <div>

                <span>
                    Payment
                </span>

                <strong>
                    ${best.payment}
                </strong>

            </div>
        `;
    }


    if (action === "STORE") {

        return `

            <div>

                <span>
                    Future price
                </span>

                <strong>
                    ${money(best.futurePrice)}/kg
                </strong>

            </div>


            <div>

                <span>
                    Transport cost
                </span>

                <strong>
                    ${money(best.transportCost)}
                </strong>

            </div>


            <div>

                <span>
                    Storage cost
                </span>

                <strong>
                    ${money(best.storageCost)}
                </strong>

            </div>


            <div>

                <span>
                    Storage period
                </span>

                <strong>
                    ${best.storageDays} days
                </strong>

            </div>
        `;
    }


    if (action === "PROCESS") {

        if (best.mode === "company") {

            return `

                <div>

                    <span>
                        Buying price
                    </span>

                    <strong>
                        ${money(best.buyPrice)}/kg
                    </strong>

                </div>


                <div>

                    <span>
                        Transport cost
                    </span>

                    <strong>
                        ${money(best.transportCost)}
                    </strong>

                </div>


                <div>

                    <span>
                        Capacity
                    </span>

                    <strong>
                        ${best.capacity} kg
                    </strong>

                </div>


                <div>

                    <span>
                        Product
                    </span>

                    <strong>
                        ${best.product}
                    </strong>

                </div>
            `;
        }


        return `

            <div>

                <span>
                    Product
                </span>

                <strong>
                    ${best.product}
                </strong>

            </div>


            <div>

                <span>
                    Estimated output
                </span>

                <strong>
                    ${Math.round(
                        best.outputQuantity
                    )} kg
                </strong>

            </div>


            <div>

                <span>
                    Processing cost
                </span>

                <strong>
                    ${money(
                        best.processingCost
                    )}
                </strong>

            </div>


            <div>

                <span>
                    Transport cost
                </span>

                <strong>
                    ${money(
                        best.transportCost
                    )}
                </strong>

            </div>
        `;
    }


    return "";
}


/* =========================================================
   13. MAIN ACTION COMPARISON
========================================================= */

function createMainActionComparison(
    rankedActions
) {

    if (!rankedActions.length) {

        return "";
    }


    return `

        <section class="card comparison-card">


            <div class="section-header">


                <div class="section-icon">

                    📊

                </div>


                <div>

                    <h2>
                        Main Action Ranking
                    </h2>


                    <p>

                        How the three rescue
                        paths compare

                    </p>

                </div>


            </div>


            <div class="action-ranking">


                ${

                    rankedActions

                        .map(
                            (item, index) => `

                                <div
                                    class="action-rank-row"
                                >


                                    <div
                                        class="action-rank-number"
                                    >

                                        #${index + 1}

                                    </div>


                                    <div
                                        class="action-rank-icon"
                                    >

                                        ${item.icon}

                                    </div>


                                    <div
                                        class="action-rank-name"
                                    >

                                        <strong>

                                            ${item.title}

                                        </strong>


                                        <span>

                                            ${item.best.name}

                                        </span>

                                    </div>


                                    <div
                                        class="action-rank-net"
                                    >

                                        ${money(
                                            item.netRealization
                                        )}

                                    </div>


                                </div>
                            `
                        )

                        .join("")
                }

            </div>


        </section>
    `;
}


/* =========================================================
   14. IMPORTANT INFORMATION
========================================================= */

function createImportantInformation(
    quantity,
    quality,
    urgency,
    location
) {

    return `

        <section class="card important-card">


            <div class="section-header">


                <div class="section-icon">

                    ℹ️

                </div>


                <div>

                    <h2>

                        Important things to know

                    </h2>


                    <p>

                        Before making the
                        final decision

                    </p>

                </div>


            </div>


            <div class="important-grid">


                <div class="important-item">

                    <strong>
                        Quality
                    </strong>


                    <p>

                        Your crop quality is

                        <b>
                            ${qualityLabel(quality)}
                        </b>.

                        Some buyers may not accept
                        every quality grade.

                    </p>

                </div>


                <div class="important-item">

                    <strong>
                        Urgency
                    </strong>


                    <p>

                        Your urgency is

                        <b>
                            ${urgencyLabel(urgency)}
                        </b>.

                        Perishable produce should not
                        be delayed unnecessarily.

                    </p>

                </div>


                <div class="important-item">

                    <strong>
                        Storage
                    </strong>


                    <p>

                        Storage can protect value only
                        when suitable storage is available
                        and the expected future price
                        justifies the additional cost.

                    </p>

                </div>


                <div class="important-item">

                    <strong>
                        Location
                    </strong>


                    <p>

                        The calculation currently treats

                        <b>
                            ${location}
                        </b>

                        as your starting location.

                        Actual route distance will be
                        added in a later version.

                    </p>

                </div>


            </div>


        </section>
    `;
}


/* =========================================================
   15. TRANSPARENCY
========================================================= */

function createTransparency() {

    return `

        <section class="card transparency-card">


            <div class="section-header">


                <div class="section-icon">

                    🧮

                </div>


                <div>

                    <h2>

                        How this prototype calculates

                    </h2>


                    <p>

                        Transparent calculations —
                        no hidden AI score

                    </p>

                </div>


            </div>


            <div class="formula-list">


                <div>

                    <strong>
                        Sell
                    </strong>


                    <span>

                        Gross value − transport cost

                    </span>

                </div>


                <div>

                    <strong>
                        Store
                    </strong>


                    <span>

                        Future gross value −
                        transport cost − storage cost

                    </span>

                </div>


                <div>

                    <strong>
                        Process
                    </strong>


                    <span>

                        Processing value −
                        processing cost − transport cost

                    </span>

                </div>


            </div>


            <div class="prototype-note">

                Prototype data is fictional.
                Prices, facilities, capacities and
                availability are not live market data.

            </div>


        </section>
    `;
}


/* =========================================================
   16. SHOW RESULTS
========================================================= */
async function showResults() {
    const requiredIds = [
        "results",
        "quantity",
        "crop",
        "location",
        "quality",
        "urgency",
        "transportRate",
        "maxDistance",
        "futurePrice",
        "storageDays"
    ];

    const missingIds = requiredIds.filter(
        id => !document.getElementById(id)
    );

    if (missingIds.length > 0) {
        alert("Missing HTML element ID(s): " + missingIds.join(", "));
        console.error("AgriRescue missing IDs:", missingIds);
        return;
    }

    const results = document.getElementById("results");

    const quantity = number(document.getElementById("quantity").value);
    const crop = document.getElementById("crop").value;
    const location = document.getElementById("location").value.trim();
    const quality = document.getElementById("quality").value;
    const urgency = document.getElementById("urgency").value;
    const transportRate = number(document.getElementById("transportRate").value);
    const maxDistance = number(document.getElementById("maxDistance").value);
    const futurePrice = number(document.getElementById("futurePrice").value);
    const storageDays = number(document.getElementById("storageDays").value);



    /* -----------------------------------------
       VALIDATION
    ----------------------------------------- */

    if (quantity <= 0) {

        alert(
            "Please enter a valid crop quantity."
        );

        return;
    }


    if (transportRate < 0) {

        alert(
            "Please enter a valid transport cost."
        );

        return;
    }


    if (maxDistance <= 0) {

        alert(
            "Please enter a valid maximum distance."
        );

        return;
    }


    if (futurePrice <= 0) {

        alert(
            "Please enter a valid expected future price."
        );

        return;
    }


    if (storageDays <= 0) {

        alert(
            "Please enter a valid storage period."
        );

        return;
    }


    /* -----------------------------------------
       CALCULATIONS
    ----------------------------------------- */

    const sellOptions =
        calculateSellOptions(
            quantity,
            quality,
            transportRate,
            maxDistance
        );


    const storageOptions =
        calculateStorageOptions(
            quantity,
            quality,
            transportRate,
            maxDistance,
            futurePrice,
            storageDays
        );


    const processCompanyOptions =
        calculateProcessCompanyOptions(
            quantity,
            quality,
            transportRate,
            maxDistance
        );


    const selfProcessOptionsCalculated =
        calculateSelfProcessOptions(
            quantity,
            quality,
            transportRate,
            maxDistance
        );


    const processOptions = [

        ...processCompanyOptions,

        ...selfProcessOptionsCalculated

    ].sort(
        (a, b) =>
            b.netRealization -
            a.netRealization
    );


    const rankedActions =
        rankMainActions(
            sellOptions,
            storageOptions,
            processOptions,
            urgency
        );


    /* -----------------------------------------
       DISPLAY RESULTS
    ----------------------------------------- */

    results.classList.remove(
        "hidden"
    );


    results.innerHTML = `

        ${createMainRecommendation(
            rankedActions,
            quantity,
            urgency
        )}


        ${createMainActionComparison(
            rankedActions
        )}


        ${createActionSection(
            "SELL",
            "Sell",
            "💰",
            sellOptions
        )}


        ${createActionSection(
            "STORE",
            "Store",
            "🏪",
            storageOptions
        )}


        ${createActionSection(
            "PROCESS",
            "Process",
            "🏭",
            processOptions
        )}


        ${createImportantInformation(
            quantity,
            quality,
            urgency,
            location ||
            "your current location"
        )}


        ${createTransparency()}

    `;
    await loadMandiPrices(crop, location);

    /* -----------------------------------------
       SCROLL TO RESULTS
    ----------------------------------------- */

    results.scrollIntoView({

        behavior: "smooth",

        block: "start"

    });
}


/* =========================================================
   17. CONNECT BUTTON
========================================================= */


document.addEventListener("DOMContentLoaded", () => {
    const farmerForm = document.getElementById("farmerForm");

    if (!farmerForm) {
        console.error("AgriRescue: #farmerForm was not found.");
        return;
    }

    farmerForm.addEventListener("submit", (event) => {
        event.preventDefault();
        showResults();
    });

    console.log("AgriRescue loaded successfully.");
});


async function loadBuyerDirectory() {
    const list = document.getElementById("buyers-list");
    const status = document.getElementById("buyers-status");

    if (!list || !status) return;

    try {
        const response = await fetch("http://127.0.0.1:8000/api/buyers");

        if (!response.ok) {
            throw new Error("Could not load buyer directory.");
        }

        const data = await response.json();
        const businesses = data.businesses || [];

        if (businesses.length === 0) {
            list.textContent = "No business leads available yet.";
            return;
        }

        list.replaceChildren();

        businesses.forEach((business) => {
            const card = document.createElement("article");
            card.className = "buyer-card";

            const name = document.createElement("h3");
            name.textContent = business.name;

            const area = document.createElement("p");
            area.textContent = "Location: " + business.area;

            const type = document.createElement("p");
            type.textContent = "Capability: " + business.business_type;

            const notice = document.createElement("p");
            notice.textContent =
                "Research lead only — direct purchasing, price, " +
                "quantity and current availability are not confirmed.";

            const website = document.createElement("a");
            website.href = business.website;
            website.textContent = "Visit website";
            website.target = "_blank";
            website.rel = "noopener noreferrer";

            card.append(name, area, type, notice, website);
            list.appendChild(card);
        });

        status.textContent =
            "Source: saved business directory. Confirm details directly with each business.";

    } catch (error) {
        list.textContent = "Buyer directory is currently unavailable.";
        status.textContent =
            "Check that the AgriRescue backend is running on port 8000.";
    }
}

document.addEventListener("DOMContentLoaded", loadBuyerDirectory);

async function loadMandiPrices(crop, location) {
    const results = document.getElementById("results");

    const heading = document.createElement("h2");
    heading.textContent = "Mandi Price Reference";

    const section = document.createElement("section");
    section.className = "card mandi-reference";

    const status = document.createElement("p");
    status.textContent = "Loading market price records...";

    section.append(heading, status);
    results.appendChild(section);

    try {
        const params = new URLSearchParams({
            state: "Maharashtra",
            commodity: crop,
            limit: "20"
        });

        const response = await fetch(
            "http://127.0.0.1:8000/api/mandi?" + params.toString()
        );

        if (!response.ok) {
            throw new Error("Mandi API request failed.");
        }

        const data = await response.json();
        const records = data.records || [];

        section.replaceChildren(heading);

        const note = document.createElement("p");
        note.textContent =
            "Reference prices only — not confirmed offers from individual buyers.";

        section.appendChild(note);

        if (data.latest_fetched_at) {
            const updated = document.createElement("p");
            updated.textContent =
                "Data last fetched: " +
                new Date(data.latest_fetched_at).toLocaleString();
            section.appendChild(updated);
        }

        if (records.length === 0) {
            const empty = document.createElement("p");
            empty.textContent =
                "No mandi records were returned for " + crop + ".";
            section.appendChild(empty);
            return;
        }

        const table = document.createElement("table");
        table.className = "mandi-table";

        const header = document.createElement("tr");

        ["Market", "District", "Modal price (₹/kg)", "Arrival date"]
            .forEach((label) => {
                const th = document.createElement("th");
                th.textContent = label;
                header.appendChild(th);
            });

        const thead = document.createElement("thead");
        thead.appendChild(header);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        records.forEach((record) => {
            const tr = document.createElement("tr");

            [
                record.market || "Unknown market",
                record.district || "Unknown district",
                record.modal_price_kg != null
                    ? "₹" + record.modal_price_kg
                    : "Not available",
                record.arrival_date || "Not available"
            ].forEach((value) => {
                const td = document.createElement("td");
                td.textContent = value;
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        section.appendChild(table);

        const freshness = document.createElement("p");
        freshness.textContent =
            data.data_freshness_warning ||
            "Check the arrival date before relying on a price.";
        section.appendChild(freshness);

    } catch (error) {
        console.error("Mandi price loading error:", error);

        status.textContent =
            "Mandi prices could not be loaded. Check that the backend is running.";
    }
}
