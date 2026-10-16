const skillsLink = document.getElementById("skillsLink");
const howItWorksLink = document.getElementById("howItWorksLink");
const communityLink = document.getElementById("communityLink");

skillsLink.addEventListener("click", function (event) {
    event.preventDefault();
    document.getElementById("skills").scrollIntoView({
        behavior: "smooth"
    });
});

howItWorksLink.addEventListener("click", function (event) {
    event.preventDefault();
    document.getElementById("how-it-works").scrollIntoView({
        behavior: "smooth"
    });
});

communityLink.addEventListener("click", function (event) {
    event.preventDefault();
    document.getElementById("community").scrollIntoView({
        behavior: "smooth"
    });
});

const skillSearch = document.getElementById("skillSearch");
const skillCards = document.getElementsByClassName("skill-card");

skillSearch.addEventListener("input", function () {
    const searchText = skillSearch.value.toLowerCase();

    for (let i = 0; i < skillCards.length; i++) {
        const cardText = skillCards[i].innerText.toLowerCase();

        if (cardText.includes(searchText)) {
            skillCards[i].style.display = "";
        } else {
            skillCards[i].style.display = "none";
        }
    }
});

