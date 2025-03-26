
    /* ======================================================
       Variables & Fonctions communes
    ====================================================== */
    // On stocke séparément le total Déchets et le total Énergie
    let totalDechetCO2 = 0;
    let totalEnergieCO2 = 0;
    let totalDeplacementsCO2=0;
   let totalImmobilisationsCO2=0;


    // Mettre à jour l'affichage du bilan global
    function updateBilanGlobal() {

      

      document.getElementById("dechetValue").innerText = totalDechetCO2.toFixed(2);
      document.getElementById("energieValue").innerText = totalEnergieCO2.toFixed(2);
      document.getElementById("deplacementsValue").innerText = totalDeplacementsCO2.toFixed(2);
      document.getElementById("immoValue").innerText = totalImmobilisationsCO2.toFixed(2);
      
      document.getElementById("bilanGlobalValue").innerText = (totalDechetCO2 + totalEnergieCO2+ totalDeplacementsCO2+ totalImmobilisationsCO2).toFixed(2);

      
    // Afficher un camembert Bilan (Déchets vs. Énergie)
  displayCarbonChartFusion(totalDechetCO2, totalEnergieCO2, totalDeplacementsCO2,totalImmobilisationsCO2,window.totalBDE || 0);
      
    }

     /* ======================================================
       Onglets
    ====================================================== */
    function openTab(evt, tabName) {
      // Masquer tous les onglets
      const contents = document.querySelectorAll(".tab-content");
      contents.forEach(c => c.style.display = "none");

      // Enlever la classe active de tous les boutons
      const buttons = document.querySelectorAll(".tab-button");
      buttons.forEach(b => b.classList.remove("active"));

      // Afficher le contenu sélectionné
      document.getElementById(tabName).style.display = "block";
      evt.currentTarget.classList.add("active");

      // Si on va sur "Bilan total", on met à jour l'affichage
      if (tabName === "tab-bilan") {
        updateBilanGlobal();
      }
    }

    // Ouvrir le dernier onglet bilan total par défaut
    document.querySelectorAll(".tab-button")[0].click();


  
    function displayCarbonChartFusion(dechet, energie, deplacement, immobilisations, bde) {
      const ctx = document.getElementById('carbonChartFusion').getContext('2d');
      
      // Détruire le graphique existant, le cas échéant
      if (window.myChart) {
        window.myChart.destroy();
      }
      
      window.myChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ["Déchets", "Energie", "Déplacements", "BDE"],
          datasets: [{
            label: 'Émissions totales de CO2 (kg CO₂e)',
            data: [
              dechet.toFixed(2),
              energie.toFixed(2),
              deplacement.toFixed(2),
              immobilisations.toFixed(2),
              bde.toFixed(2)
            ],
            backgroundColor: [
              'rgba(75, 192, 192, 0.6)',
              'rgba(255, 99, 132, 0.6)',
              'rgba(28, 99, 132, 0.6)',
              'rgba(30, 255, 102, 0.6)',
              'rgba(201, 255, 102, 0.6)'
            ],
            borderWidth: 1
          }]
        },
        options: { responsive: true }
      });
    }

    function updateChartWithBDE() {
      fetch("get_total_bde.php")
        .then(response => response.json())
        .then(data => {
           if (typeof data.total_bde === "undefined") {
               alert("Erreur lors de la récupération des données BDE");
           } else {
               // On s'assure que totalBDE est un nombre
               const totalBDE = parseFloat(data.total_bde);
               // Redessiner le graphique avec le totalBDE récupéré
               displayCarbonChartFusion(totalDechetCO2, totalEnergieCO2, totalDeplacementsCO2, totalImmobilisationsCO2, totalBDE);
               document.getElementById("bilanGlobalValue").textContent = "" + (totalDechetCO2 + totalEnergieCO2 + totalDeplacementsCO2+ totalImmobilisationsCO2+totalBDE).toFixed(2);

           }
        })
        .catch(error => console.error("Erreur lors de la récupération du BDE :", error));
    }
    
    document.getElementById("afficherBDE").addEventListener("click", updateChartWithBDE);


  //revenir à l'affichage sans BDE
  function revertToOriginalChart() {
    displayCarbonChartFusion(totalDechetCO2, totalEnergieCO2, totalDeplacementsCO2, totalImmobilisationsCO2, 0);
    document.getElementById("bilanGlobalTexte").textContent = "Bilan global : " + (totalDechetCO2 + totalEnergieCO2 + totalDeplacementsCO2 +totalImmobilisationsCO2).toFixed(2) + " kg CO₂e";
}

document.getElementById("revenirSansBDE").addEventListener("click", revertToOriginalChart);


    // Exporter le bilan global
    function exportToExcelFusion() {
      if ((totalDechetCO2 + totalEnergieCO2 + totalDeplacementsCO2+ totalImmobilisationsCO2) <= 0) {
        alert("Aucun calcul effectué pour le bilan global.");
        return;
      }

      const currentDate = new Date();
      const day = currentDate.getDate().toString().padStart(2, '0');
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const year = currentDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;

      const worksheetData = [
        ["Bilan Carbone Global (kg CO₂e)", "Déchets (kg CO₂e)", "Énergie (kg CO₂e)", "Déplacements","Immobilisations" ,"Date"],
        [(totalDechetCO2 + totalEnergieCO2).toFixed(2), totalDechetCO2, totalEnergieCO2, totalDeplacementsCO2, totalImmobilisationsCO2, formattedDate]
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bilan Global");

      const fileName = `BilanGlobal_${formattedDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    }




    /* ======================================================
       Code pour la partie "Déchets"
    ====================================================== */
    // Données  pour les émissions de CO2 (en kgCO2 par kg de déchet)
    const emissionsCO2Dechets = {
      carton: 0.3,
      plastique: 6.0,
      verre: 0.2,
      bois: 0.1,
      ordures: 1.0,
      dechetsVerts: 0.1,
      deee: 5.0,
      piles: 0.5,
      metaux: 2.0,
      eauxUsees: 0.1
    };

    let emissionDechets = 0;
    let emissionMenagers = 0;
    let emissionAutre = 0;
    let totalEauxUsees = 0;

    function ajouterDechet() {
      const select = document.getElementById("dechet");
      const typeDechettext = select.options[select.selectedIndex].text;
      const typeDechet = document.getElementById("dechet").value;
      const quantite = parseFloat(document.getElementById("quantite").value);
      if (isNaN(quantite) || quantite <= 0) {
        alert("Veuillez entrer une quantité valide");
        return;
      }
      const li = document.createElement("li");
      li.textContent = `${quantite} kg de ${typeDechettext}`;
      document.getElementById("listeDechets").appendChild(li);
      emissionDechets += (emissionsCO2Dechets[typeDechet] || 0) * quantite;
    }

    function ajouterDechetMenager() {
      const select = document.getElementById("dechetMenager");
      const typeDechettext = select.options[select.selectedIndex].text;
      const typeDechet = document.getElementById("dechetMenager").value;
      const quantite = parseFloat(document.getElementById("quantiteMenager").value);
      if (isNaN(quantite) || quantite <= 0) {
        alert("Veuillez entrer une quantité valide");
        return;
      }
      const li = document.createElement("li");
      li.textContent = `${quantite} kg de ${typeDechettext}`;
      document.getElementById("listeDechetsMenagers").appendChild(li);
      emissionMenagers += (emissionsCO2Dechets[typeDechet] || 0) * quantite;
    }

    function ajouterDechetAutre() {
      const select = document.getElementById("dechetAutre");
      const typeDechettext = select.options[select.selectedIndex].text;
      const typeDechet = document.getElementById("dechetAutre").value;
      const quantite = parseFloat(document.getElementById("quantiteAutre").value);
      if (isNaN(quantite) || quantite <= 0) {
        alert("Veuillez entrer une quantité valide");
        return;
      }
      const li = document.createElement("li");
      li.textContent = `${quantite} kg de ${typeDechettext}`;
      document.getElementById("listeAutresDechets").appendChild(li);
      emissionAutre += (emissionsCO2Dechets[typeDechet] || 0) * quantite;
    }

    function calculerEmissionsDechets() {
      const volumeEaux = parseFloat(document.getElementById("volumeEaux").value) || 0;
      if (volumeEaux < 0) {
        alert("Veuillez entrer une quantité d'eau valide");
        return;
      }
      totalEauxUsees = volumeEaux * 0.1;

      // Bilan
      totalDechetCO2 = emissionDechets + emissionMenagers + emissionAutre + totalEauxUsees;

      // Afficher résultat
      document.getElementById("resultatCO2").textContent = `Total des émissions : ${totalDechetCO2.toFixed(2)} kg CO₂e`;
      displayCarbonChartDechets(emissionDechets, emissionMenagers, emissionAutre, totalEauxUsees);

      document.getElementById("form-section-dechets").style.display = "none";
      document.getElementById("result-section-dechets").style.display = "block";
      console.log("updateBilanGlobal a bien été appelée !");

    }

    function displayCarbonChartDechets(eDechets, eMenagers, eAutre, eEaux) {
      const ctx = document.getElementById('carbonChartDechets').getContext('2d');
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: [
            'Déchets Emballages',
            'Déchets Ménagers',
            'Autres Déchets',
            'Eaux Usées'
          ],
          datasets: [{
            label: 'Émissions de CO2 (kg CO₂e)',
            data: [
              eDechets.toFixed(2),
              eMenagers.toFixed(2),
              eAutre.toFixed(2),
              eEaux.toFixed(2)
            ],
            backgroundColor: [
              'rgba(75, 192, 192, 0.6)',
              'rgba(255, 99, 132, 0.6)',
              'rgba(201, 255, 102, 0.6)',
              'rgba(255, 159, 64, 0.6)'
            ],
            borderWidth: 1
          }]
        },
        options: { responsive: true }
      });
    }

    function exportToExcelDechets() {
      if (totalDechetCO2 <= 0) {
        alert("Veuillez effectuer un calcul avant d'exporter.");
        return;
      }
      const currentDate = new Date();
      const day = currentDate.getDate().toString().padStart(2, '0');
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const year = currentDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;

      const worksheetData = [
        ["Bilan Carbone Déchets (kg CO₂e)", "Déchets Emballages", "Ménagers", "Autres Déchets", "Eaux Usées", "Date"],
        [totalDechetCO2, emissionDechets, emissionMenagers, emissionAutre, totalEauxUsees, formattedDate]
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Déchets");
      const fileName = `Bilan_Carbone_Dechets_${formattedDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    }

    function goBackDechets() {
      document.getElementById("form-section-dechets").style.display = "block";
      document.getElementById("result-section-dechets").style.display = "none";
    }

    function resetDechets() {
      document.getElementById("formulaire").reset();
      emissionDechets = 0;
      emissionMenagers = 0;
      emissionAutre = 0;
      totalEauxUsees = 0;
      totalDechetCO2 = 0;
      document.getElementById("listeDechets").innerHTML = '';
      document.getElementById("listeDechetsMenagers").innerHTML = '';
      document.getElementById("listeAutresDechets").innerHTML = '';
      document.getElementById("result-section-dechets").style.display = 'none';
      document.getElementById("form-section-dechets").style.display = 'block';
    }


    /* ======================================================
       Code pour la partie "Énergie"
    ====================================================== */
    const emissionsCO2Energie = {
      electricite: 0.038,
      naturel: 0.24,
      propane:0.2717,
      fioul:0.3243,
      biomethane:0.0444,
      vapeur: {
        belley: 0.2,
        autre_reseau: 0.25
      },
      froid: {
        testfroid: 0.1,
        autre_froid: 0.15
      }
    };

    let emissionElectricite = 0;
    let emissionGaz = 0;
    let emissionVapeur = 0;
    let emissionFroid = 0;

    function calculerEmissionsEnergie() {
      const electricite = parseFloat(document.getElementById('electricite').value) || 0;
      const gaz = parseFloat(document.getElementById('Gaz').value) || 0;
      const gazType = document.getElementById('gaz').value;
      const vapeur = parseFloat(document.getElementById('vapeur').value) || 0;
      const froid = parseFloat(document.getElementById('froid').value) || 0;
      const vapeurType = document.getElementById('vapeurType').value;
      const froidType = document.getElementById('froidType').value;

      // Vérification
      if (electricite < 0 || gaz < 0 || vapeur < 0 || froid < 0) {
        alert("Entrez des valeurs positives");
        return;
      }

      // Calcul
      emissionElectricite = electricite * emissionsCO2Energie.electricite;
      
      if(gaz >0 && gazType in emissionsCO2Energie){
        emissionGaz = gaz * emissionsCO2Energie[gazType];
      }else{
        emissionGaz= 0;
      }

      if (vapeur > 0 && vapeurType in emissionsCO2Energie.vapeur) {
        emissionVapeur = vapeur * emissionsCO2Energie.vapeur[vapeurType];
      } else {
        emissionVapeur = 0;
      }

      if (froid > 0 && froidType in emissionsCO2Energie.froid) {
        emissionFroid = froid * emissionsCO2Energie.froid[froidType];
      } else {
        emissionFroid = 0;
      }

      totalEnergieCO2 = emissionElectricite + emissionGaz + emissionVapeur + emissionFroid;

      // Affichage
      document.getElementById('result-energie').innerHTML = `
        <p>Les émissions totales sont de <strong>${totalEnergieCO2.toFixed(2)} kg CO₂e</strong>.</p>
        <p>Électricité : <strong>${emissionElectricite.toFixed(2)} kg CO₂e</strong></p>
        <p>Gaz : <strong>${emissionGaz.toFixed(2)} kg CO₂e</strong></p>
        <p>Vapeur : <strong>${emissionVapeur.toFixed(2)} kg CO₂e</strong></p>
        <p>Froid : <strong>${emissionFroid.toFixed(2)} kg CO₂e</strong></p>
      `;

      displayCarbonChartEnergie(emissionElectricite, emissionGaz, emissionVapeur, emissionFroid);

      document.getElementById("form-section-energie").style.display = "none";
      document.getElementById("result-section-energie").style.display = "block";
      console.log("updateBilanGlobal a bien été appelée !");

    }

    function displayCarbonChartEnergie(eElec, eGaz, eVapeur, eFroid) {
      const ctx = document.getElementById('carbonChartEnergie').getContext('2d');
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: [
            "Électricité",
            "Gaz",
            "Vapeur",
            "Froid"
          ],
          datasets: [{
            label: 'Émissions de CO2 (kg CO₂e)',
            data: [
              eElec.toFixed(2),
              eGaz.toFixed(2),
              eVapeur.toFixed(2),
              eFroid.toFixed(2)
            ],
            backgroundColor: [
              'rgba(75, 192, 192, 0.6)',
              'rgba(255, 99, 132, 0.6)',
              'rgba(201, 255, 102, 0.6)',
              'rgba(255, 159, 64, 0.6)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true
        }
      });
    }

    function exportToExcelEnergie() {
      if (totalEnergieCO2 <= 0) {
        alert("Veuillez effectuer un calcul avant d'exporter les résultats.");
        return;
      }

      const currentDate = new Date();
      const day = currentDate.getDate().toString().padStart(2, '0');
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const year = currentDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;

      const worksheetData = [
        ["Bilan Carbone Énergie (kg CO₂e)", "Électricité", "Gaz", "Vapeur", "Froid", "Date"],
        [totalEnergieCO2, emissionElectricite, emissionGaz, emissionVapeur, emissionFroid, formattedDate]
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Énergie");
      const fileName = `Bilan_Carbone_Energie_${formattedDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    }

    function goBackEnergie() {
      document.getElementById("form-section-energie").style.display = "block";
      document.getElementById("result-section-energie").style.display = "none";
    }

    function resetEnergie() {
      document.getElementById("form-section-energie").querySelector("form").reset();
      emissionElectricite = 0;
      emissionGaz = 0;
      emissionVapeur = 0;
      emissionFroid = 0;
      totalEnergieCO2 = 0;
      document.getElementById("result-section-energie").style.display = 'none';
      document.getElementById("form-section-energie").style.display = 'block';
    }

    function enregistrerBilan() {
      let totaux = totalDechetCO2 + totalEnergieCO2;
      let total_waste = totalDechetCO2;
      let total_energie = totalEnergieCO2;
    
      let data = {
        bilan_total: totaux,
        bilan_dechets: total_waste,
        bilan_nrj: total_energie
      };
    
      console.log("Données envoyées :", data);
    
      fetch("enregistrer_bilan.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      .then(response => response.json())
      .then(responseData => {
          console.log("Réponse du serveur :", responseData);
          if (responseData.message) {
              alert(responseData.message);
          } else if (responseData.error) {
              alert(responseData.error);
          } else {
              alert("Réponse inattendue : " + JSON.stringify(responseData));
          }
      })
      .catch(error => {
          console.error("Erreur lors de l'envoi :", error);
          alert("Erreur lors de l'envoi : " + error);
      });
    }
    

function goBack() {
    document.getElementById('formulaire').style.display = 'block';
    document.getElementById('result-section').style.display = 'none';
}


    /* ======================================================
       Code pour la partie "Déplacements"
    ====================================================== */
    //tableaux de stockage

let peopleTransports=[];//déplacements domicile travail
let gasT=[]; //différents carburants
let peopleWtransport=[]; //déplacement cadre travail
let gasW=[];// différents carburants cadre travail
let peopleItransport=[]; //déplacements invités
let gasI=[]; //différents carburants invités

//variables totales de calcul

let co2DeplacementsDomicileTravail=0;
let co2DeplacementsDomicileTravailCarburant=0;
let co2DeplacementsCadreTravail = 0;
let co2DeplacementsCadreTravailCarburant=0;
let co2DeplacementsInvites=0;
let co2DeplacementsInvitesCarburant=0;
//fonction d'ajout et de mises à jours des listes

//déplacement domicile travail

function addPeopleTransport(){

    const mode = document.getElementById("deplacementdtmode").value;
    const distance = parseFloat(document.getElementById("distancedt").value);
    const number = parseInt(document.getElementById("peopledt").value);

//-------------------------REvoir la gestion des erreurs correctement-------//
    if (mode && !isNaN(distance) && distance > 0) {
        if (isNaN(number) || number < 1) {
            alert("Veuillez renseigner un nombre valide (>=1).");
            return;
        }

    
       peopleTransports.push({mode: mode, distance: distance, number: number});
       updatePeopleTransportList();
}
}

function updatePeopleTransportList(){
    const list = document.getElementById("people-transport-list");
    list.innerHTML='';
    peopleTransports.forEach(pt=>{
        const li = document.createElement('li');
        li.textContent= `Mode: ${pt.mode}, Distance: ${pt.distance} km, ${pt.mode === "voitureEssence" || pt.mode === "voitureDiesel" || pt.mode === "hybride" || pt.mode ==="electrique" ? "Voitures" : "Personnes"}: ${pt.number}`;
        list.appendChild(li);
    });
}

function updatePeopleNumberLabel() {
    const mode = document.getElementById("deplacementdtmode").value;
    const label = document.getElementById("peoplenumber"); // On récupère l'élément label

    // On compare directement la valeur
    if (mode === "voitureEssence" || mode === "voitureDiesel" || mode ==="hybride" || mode ==="electrique") {
        label.textContent = "Nombre de voitures :";
    } else {
        label.textContent = "Nombre de personnes :";
    }

    
}

function addGas(){
    const type = document.getElementById("gas").value;
    const quantity = parseFloat(document.getElementById("gas-quantity").value);
//rajouter correctement la gestion des erreurs

// --------------------------------//
    if(type && !isNaN(quantity) && quantity>0){
        if (isNaN(quantity) || quantity < 1) {
            alert("Veuillez renseigner un nombre valide (>=1).");
            return;
        }

        gasT.push({type: type, quantity: quantity});
        updateGasList();
      
    }
}

function updateGasList(){
    const list = document.getElementById("gas-list");
    list.innerHTML='';
    gasT.forEach(gt=>{
        const li = document.createElement('li');
        li.textContent = `Carburant: ${gt.type}, Quantité: ${gt.quantity} L`;
        list.appendChild(li);
    });
}

//--- fonction pour les déplacements cadre de travail-------
function addPeopleWTransport(){

    const mode = document.getElementById("deplacementctmode").value;
    const distance = parseFloat(document.getElementById("distancect").value);
    const number = parseInt(document.getElementById("peoplect").value);

//-------------------------REvoir la gestion des erreurs correctement-------//
    if (mode && !isNaN(distance) && distance > 0) {
        if (isNaN(number) || number < 1) {
            alert("Veuillez renseigner un nombre valide (>=1).");
            return;
        }

    
        peopleWtransport.push({mode: mode, distance: distance, number: number});
       updatePeopleWTransportList();
}
}

function updatePeopleWTransportList(){
    const list = document.getElementById("peoplework-transport-list");
    list.innerHTML='';
    peopleWtransport.forEach(pt=>{
        const li = document.createElement('li');
        li.textContent= `Mode: ${pt.mode}, Distance: ${pt.distance} km, ${pt.mode === "voitureEssence" || pt.mode === "voitureDiesel" || pt.mode === "hybride" || pt.mode ==="electrique" ? "Voitures" : "Personnes"}: ${pt.number}`;
        list.appendChild(li);
    });
}

function updatePeopleWNumberLabel() {
    const mode = document.getElementById("deplacementctmode").value;
    const label = document.getElementById("peopleworknumber"); // On récupère l'élément label

    // On compare directement la valeur
    if (mode === "voitureEssence" || mode === "voitureDiesel" || mode ==="hybride" || mode ==="electrique") {
        label.textContent = "Nombre de voitures :";
    } else if(mode ==="avion1court" || mode==="avionmoyen1"|| mode==="avionlong1") {
        label.textContent ="Nombre de voyages";
       
    } else{
        label.textContent = "Nombre de personnes :";
    }
   

    
}

function addGasW(){
    const type = document.getElementById("gasw").value;
    const quantity = parseFloat(document.getElementById("gasw-quantity").value);
//rajouter correctement la gestion des erreurs

// --------------------------------//
    if(type && !isNaN(quantity) && quantity>0){
        if (isNaN(quantity) || quantity < 1) {
            alert("Veuillez renseigner un nombre valide (>=1).");
            return;
        }

        gasW.push({type: type, quantity: quantity});
        updateGasWList();
      
    }
}

function updateGasWList(){
    const list = document.getElementById("gasw-list");
    list.innerHTML='';
    gasW.forEach(g=>{
        const li = document.createElement('li');
        li.textContent = `Carburant: ${g.type}, Quantité: ${g.quantity} L`;
        list.appendChild(li);
    });
}
/*---------------------------//fonctions pour déplacements d'invités---------------------------------------------------------
----------------------------------------------------------------------------------------
------------------------------------------------------------------------------------
*/

function addPeopleITransport(){

    const mode = document.getElementById("deplacementimode").value;
    const distance = parseFloat(document.getElementById("distancei").value);
    const number = parseInt(document.getElementById("peoplei").value);

//-------------------------REvoir la gestion des erreurs correctement-------//
    if (mode && !isNaN(distance) && distance > 0) {
        if (isNaN(number) || number < 1) {
            alert("Veuillez renseigner un nombre valide (>=1).");
            return;
        }

    
        peopleItransport.push({mode: mode, distance: distance, number: number});
       updatePeopleITransportList();
}
}

function updatePeopleITransportList(){
    const list = document.getElementById("peopleinvite-transport-list");
    list.innerHTML='';
    peopleItransport.forEach(pt=>{
        const li = document.createElement('li');
        li.textContent= `Mode: ${pt.mode}, Distance: ${pt.distance} km, ${pt.mode === "voitureEssence" || pt.mode === "voitureDiesel" || pt.mode === "hybride" || pt.mode ==="electrique" ? "Voitures" : "Personnes"}: ${pt.number}`;
        list.appendChild(li);
    });
}

function updatePeopleINumberLabel() {
    const mode = document.getElementById("deplacementimode").value;
    const label = document.getElementById("peopleinvitenumber"); // On récupère l'élément label

    // On compare directement la valeur
    if (mode === "voitureEssence" || mode === "voitureDiesel" || mode ==="hybride" || mode ==="electrique") {
        label.textContent = "Nombre de voitures :";
    } else if(mode ==="avion1court" || mode==="avionmoyen1"|| mode==="avionlong1") {
        label.textContent ="Nombre de voyages";
       
    } else{
        label.textContent = "Nombre de personnes :";
    }
   

    
}

function addGasI(){
    const type = document.getElementById("gasi").value;
    const quantity = parseFloat(document.getElementById("gasi-quantity").value);
//rajouter correctement la gestion des erreurs

// --------------------------------//
    if(type && !isNaN(quantity) && quantity>0){
        if (isNaN(quantity) || quantity < 1) {
            alert("Veuillez renseigner un nombre valide (>=1).");
            return;
        }

        gasI.push({type: type, quantity: quantity});
        updateGasIList();
      
    }
}

function updateGasIList(){
    const list = document.getElementById("gasi-list");
    list.innerHTML='';
    gasI.forEach(g=>{
        const li = document.createElement('li');
        li.textContent = `Carburant: ${g.type}, Quantité: ${g.quantity} L`;
        list.appendChild(li);
    });
}



//fonctions de calculs

//calcul émission déplacement domiciles travail (Moyen de déplacement + Carburant)

function calculatePeopleTransport(){
    const factors ={  //à modifier
        voitureEssence:0.178,
        voitureDiesel:0.227,
        hybride:0.175,
        electrique:0.160,
        tramway:0.0253,
        bus:0.027,
        marche:0,
        velo:0,
        train:0.0253
        

    };

    let total=0;
    peopleTransports.forEach(pt=>{
        let factor = factors[pt.mode] || 0;
        total += pt.distance * factor * pt.number;
    });
    return total;
}

function calculateGasPeople(){
    const factors={ //à modifier
        essence: 0.12,
        essence1: 0.157,
        gazole: 0.78,
        biodiesel:0.78,
        bioethanol:0.45,
        gnl:0.36
    };
    let total=0;
    gasT.forEach(gt=>{
        let factor = factors[gt.type] || 0; 
        total += gt.quantity * factor;
    });
   return total;
}

//------------------------Calcul emissions cadre travail----//

function calculatePeopleWTransport(){
    const factors ={  //à modifier
        voitureEssence:0.178,
        voitureDiesel:0.227,
        hybride:0.175,
        electrique:0.160,
        tramway:0.0253,
        bus:0.027,
        marche:0,
        velo:0,
        train:0.0253
        

    };

    let total=0;
    peopleWtransport.forEach(pt=>{
        let factor = factors[pt.mode] || 0;
        total += pt.distance * factor * pt.number;
    });
    return total;
}

function calculateGasWPeople(){
    const factors={ //à modifier
        essence: 0.12,
        essence1: 0.157,
        gazole: 0.78,
        biodiesel:0.78,
        bioethanol:0.45,
        gnl:0.36
    };
    let total=0;
    gasW.forEach(gt=>{
        let factor = factors[gt.type] || 0; 
        total += gt.quantity * factor;
    });
   return total;
}

//----------------------------------calculs émissions invités------//

function calculatePeopleITransport(){
    const factors ={  //à modifier
        voitureEssence:0.178,
        voitureDiesel:0.227,
        hybride:0.175,
        electrique:0.160,
        tramway:0.0253,
        bus:0.027,
        marche:0,
        velo:0,
        train:0.0253,
        avioncourt:0.227,
        avionmoyen:0.200,
        avionlong:0.178,
        avion1court:0.220,
        avionmoyen1:0.205,
        avionlong1:0.180
        

    };

    let total=0;
    peopleItransport.forEach(pt=>{
        let factor = factors[pt.mode];
        total += pt.distance * factor * pt.number;
    });
    return total;
}

function calculateGasIPeople(){
    const factors={ //à modifier
        essence: 0.12,
        essence1: 0.157,
        gazole: 0.78,
        biodiesel:0.78,
        bioethanol:0.45,
        gnl:0.36
    };
    let total=0;
    gasI.forEach(gt=>{
        let factor = factors[gt.type] || 0; 
        total += gt.quantity * factor;
    });
   return total;
}

//-------------Fonction affichage graphique----------------//
function displayCarbonChartDeplacements(co2DeplacementsDomicileTravail,co2DeplacementsCadreTravail,co2DeplacementsInvites){
    const ctx = document.getElementById('carbonChartDeplacements').getContext('2d');

   // Création du graphique
   new Chart(ctx, {
    type: 'pie',
    data: {
        labels: ['Déplacements Domicile Travail', 'Déplacements Cadre Travail','Déplacements invités'],
        datasets: [{
            label: 'Répartion des Émissions carbone (kg CO₂e)',
            data: [co2DeplacementsDomicileTravail.toFixed(2), co2DeplacementsCadreTravail.toFixed(2), co2DeplacementsInvites.toFixed(2)],
            backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(80, 24, 192, 0.6)' ],
            borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)', 'rgba(80, 24, 192, 1)' ],
            borderWidth: 1
        }]
    },
    options: {
        plugins: {
            title: {
                display: true,                 // Afficher le titre
                text: 'Répartition des Émissions Carbone', // Texte du titre
                font: {
                    size: 18,                  // Taille de la police
                    weight: 'bold',            // Poids de la police (gras)
                },
                padding: {
                    top: 20                   // Espacement au-dessus du titre (ajustable)
                },
                position: 'bottom',             // Position du titre en bas
            },
            legend: {
                display: true // Masquer la légende (si vous ne la voulez pas)
            }
        }
    }
});
}

//----------exportation Excel----
function exportExcel(){
    const currentDate = new Date();
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear();
    const formatteddate = `${day}-${month}-${year}`;

    const worksheetData = [
        ["Bilan Carbone Total (kg CO₂e)", "Déplacements Domicile-Travail", "Déplacements Cadre-Travail","Déplacements invités", "Date"],
        [totalDeplacementsCO2.toFixed(2), co2DeplacementsDomicileTravail.toFixed(2), co2DeplacementsCadreTravail.toFixed(2), co2DeplacementsInvites.toFixed(2), formatteddate]
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Résultats Bilan Carbone");
    const fileName = `Bilan_Carbone_Déplacements_${formatteddate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

//-----------------------------------calcul global-----------------------//
function calculateCO2Deplacements(){
    //calcul émissions par section
    co2DeplacementsDomicileTravail = calculatePeopleTransport();
    co2DeplacementsDomicileTravailCarburant = calculateGasPeople();
    co2DeplacementsCadreTravail = calculatePeopleWTransport();
    co2DeplacementsCadreTravailCarburant=calculateGasWPeople();
    co2DeplacementsInvites = calculatePeopleITransport();
    co2DeplacementsInvitesCarburant = calculateGasIPeople();

    totalDeplacementsCO2 = co2DeplacementsDomicileTravail + co2DeplacementsDomicileTravailCarburant + co2DeplacementsCadreTravail + co2DeplacementsCadreTravailCarburant + co2DeplacementsInvites + co2DeplacementsInvitesCarburant;
    let resultHTML= `
    <p> Le bilan carbone total est de <strong>${totalDeplacementsCO2.toFixed(2)}</strong></p>
    <p> Emissions liés au déplacement domicile-trvail: <strong> ${co2DeplacementsDomicileTravail.toFixed(2)} </strong> et conso de carburant :<strong> ${co2DeplacementsDomicileTravailCarburant}</strong></p>
    <p> Emissions déplacement de personnes dans le cadre du travail: <strong>${co2DeplacementsCadreTravail.toFixed(2)}</strong> , en termes de carburant : <strong>${co2DeplacementsCadreTravailCarburant}</strong></p>
    <p> Emissions déplacement de personnes des invités/visiteurs: <strong>${co2DeplacementsInvites.toFixed(2)}</strong> , en termes de carburant : <strong>${co2DeplacementsInvitesCarburant}</strong></p>

    `
    document.getElementById('result').innerHTML= resultHTML;

    displayCarbonChartDeplacements(co2DeplacementsDomicileTravail,co2DeplacementsCadreTravail,co2DeplacementsInvites);

    document.getElementById('formulaire-deplacements').style.display='none';
    document.getElementById('result-section-deplacements').style.display='block';
}

function goBackDeplacements(){
    document.getElementById('result-section-deplacements').style.display='none';
    document.getElementById('formulaire-deplacements').style.display='block'
}



    /* ======================================================
       Code pour la partie "Immobilisations"
    ====================================================== */
    //tableaux de stockages
let routeParking = [];
let materiel = [];

//variables globales

let co2Bâtiment=0;
let co2RoutesParking=0;
let co2Materiel=0;



//fonctions d'ajout et de mise à jour des listes

function addRouteParking(){
    const type = document.getElementById("voirie").value;
    const superficie = parseFloat(document.getElementById("surface").value);
    const annees = parseInt(document.getElementById("amortissement1").value);


    //condition de validation formulaire à mettre ici après

    //méthode d'ajout au tableau 
    routeParking.push({type: type, superficie: superficie, annees: annees});
   updateRouteParkingList();
}

function updateRouteParkingList(){
    const list = document.getElementById("route-parking-list");
    list.innerHTML='';
    routeParking.forEach(rp=>{
        const li = document.createElement('li');
        li.textContent=  `Type: ${rp.type}, Superficie: ${rp.superficie}, Ammortissement(années): ${rp.annees}  `;
        list.appendChild(li);
    });
}


function addMateriel(){
    const type = document.getElementById("matériel").value;
    const nombre = parseInt(document.getElementById("nombre").value);
    const annees = parseInt(document.getElementById("amortissement2").value);

    //conditions de vérification du formulaire à rajouter 


    materiel.push({type: type, nombre:nombre, annees:annees});
    updateMaterielList();
}

function updateMaterielList() {
  const list = document.getElementById("materiel-list");
  list.innerHTML = '';
  materiel.forEach((m, index) => {  // ici, "index" est correctement défini
      const li = document.createElement('li');
      li.textContent = `Type: ${m.type}, Nombre: ${m.nombre}, Amortissement (années): ${m.annees} `;
      
      // Création du bouton "Supprimer"
      const btnSupprimer = document.createElement('button');
      btnSupprimer.type = "button"; // empêche la soumission du formulaire
      btnSupprimer.textContent = 'Supprimer';
      btnSupprimer.id = "delete-btn-" + index;
      btnSupprimer.onclick = () => removeMateriel(index);
      
      li.appendChild(btnSupprimer);
      list.appendChild(li);
  });
}


function removeMateriel(index){
  //retire l'élement du tableau à l'indice passé en paramètre
  materiel.splice(index,1);
  //mise à jour affichage
  updateMaterielList();
}

//---------------------------------------fonction de calculs----------------------//

//---------------------------------------Emission bâtiments----------------------
function calculCo2Batiment(){
    const facteurEmission = 440 //etablissement d'enseignement supérieur structure en béton
    let total =0;

    const surface = parseFloat(document.getElementById("bat").value);
    const annees = parseFloat(document.getElementById("amortissement").value);

    total = (surface * facteurEmission)/annees;
    return total || 0; //champ à modifier 
}




//---------------Emission route, parkings----------------//
function calculateCO2RouteParking(){
    const factors={
        parking:73,
        RouteTC4:103
    };
    let total = 0;
    routeParking.forEach(rp=>{
        let factor= factors[rp.type];
        total += (factor * rp.superficie)/rp.annees;
    });
    return total || 0;
}

//---------------Emission Matériel Info----------------//
function calculateCO2Materiel(){
    const factors={
        Ecran21:205,
        portable:103,
        ordinateurFixe:2.55,
        Ecran23:4.26,
        imprimanteLaser:229,
        Imprimante:7.98,
        photocopieurs:1199,
        imprimanteMultiFonctions:4.94,
        ServeursInformatiques:47.4,
        videoPrjecteurs:21.5
    };
    let total = 0;
    materiel.forEach(m=>{
        let factor= factors[m.type];
        total += (factor * m.nombre)/m.annees;
    });
    return total || 0;
}
//-----fonction afficher graphe------
function displayCarbonChartImmo(co2Bâtiment,co2RoutesParking,co2Materiel){
    const ctx = document.getElementById('carbonChartImmo').getContext('2d');

   // Création du graphique
   new Chart(ctx, {
    type: 'pie',
    data: {
        labels: ['Bâtiments', 'Routes & Parkings','Matériels Informatique'],
        datasets: [{
            label: 'Répartion des Émissions carbone (kg CO₂e)',
            data: [co2Bâtiment.toFixed(2), co2RoutesParking.toFixed(2), co2Materiel.toFixed(2)],
            backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(80, 24, 192, 0.6)' ],
            borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)', 'rgba(80, 24, 192, 1)' ],
            borderWidth: 1
        }]
    },
    options: {
        plugins: {
            title: {
                display: true,                 // Afficher le titre
                text: 'Répartition des Émissions Carbone', // Texte du titre
                font: {
                    size: 18,                  // Taille de la police
                    weight: 'bold',            // Poids de la police (gras)
                },
                padding: {
                    top: 20                   // Espacement au-dessus du titre (ajustable)
                },
                position: 'bottom',             // Position du titre en bas
            },
            legend: {
                display: true // Masquer la légende (si vous ne la voulez pas)
            }
        }
    }
});
}

//----------exportation Excel----
function exportExcel(){
    const currentDate = new Date();
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear();
    const formatteddate = `${day}-${month}-${year}`;

    const worksheetData = [
        ["Bilan Carbone Total (kg CO₂e)", "Emissions liées aux bâtiments (kg CO₂e)", "Emissions liéss aux voiries (kg CO₂e)","Emissions liées au matériel informatique (kg CO₂e)", "Date"],
        [totalImmobilisationsCO2.toFixed(2), co2Bâtiment.toFixed(2), co2RoutesParking.toFixed(2), co2Materiel.toFixed(2), formatteddate]
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Résultats Bilan Carbone");
    const fileName = `Bilan_Carbone_Immobilisations_${formatteddate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}



//---------------Calcul total---------------
function calculateCO2Immmo(){
    //calcul des émissions
    co2Bâtiment = calculCo2Batiment();
    co2RoutesParking=calculateCO2RouteParking();
    co2Materiel =calculateCO2Materiel();

totalImmobilisationsCO2= co2Bâtiment + co2RoutesParking + co2Materiel;


let resultImmo =` 
<section>
<p>Les émissions totales liées aux immobilisations sont de <strong>${totalImmobilisationsCO2.toFixed(2)} kgCO2e</strong></p>
<p>Emissions liées aux bâtiments : <strong>${co2Bâtiment.toFixed(2)} kgCO2e</strong></p>
<p>Emissions liées aux routes & Parking : <strong>${co2RoutesParking.toFixed(2)} kgCO2e</strong></p>
<p>Emissions liées aux Matériels informatique : <strong>${co2Materiel.toFixed(2)} kgCO2e</strong></p>
</section
` 

document.getElementById('resultat').innerHTML= resultImmo;
displayCarbonChartImmo(co2Bâtiment,co2RoutesParking,co2Materiel);

document.getElementById('formulaire-immo').style.display='none';
document.getElementById('result-section-immo').style.display='block';
}

function goBackImmo(){
    document.getElementById('result-section-immo').style.display='none';
    document.getElementById('formulaire-immo').style.display='block';
}

