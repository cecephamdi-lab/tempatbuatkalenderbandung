document.addEventListener('DOMContentLoaded', () => {
    // --- DEFAULTS & INITIALIZATION ---
    const defaultDataHarga={kertas:{"AP 120 gram":.219,"AP 150 gram":.268,"AP 230 gram":.402},ukuranCetak:{"31x48":3e5,"48x53":48e4,"44x64":6e5},dimensi:{"31x48":{l:31,p:48},"48x53":{l:48,p:53},"44x64":{l:44,p:64}},finishing:{jepit:17,ring:156},lainLain:{susun:50}};const defaultProfitPercentage=90;let dataHarga,profitPercentage,orderList,biayaProduksiList,galleryItems;
    function initializeData(){const savedData=localStorage.getItem("savedDataHarga"),savedProfit=localStorage.getItem("savedProfitPercentage"),savedOrders=localStorage.getItem("orderList"),savedBiayaProduksi=localStorage.getItem("biayaProduksiList"),savedGallery=localStorage.getItem('galleryItems');dataHarga=savedData?JSON.parse(savedData):defaultDataHarga;profitPercentage=savedProfit?parseFloat(savedProfit):defaultProfitPercentage;orderList=savedOrders?JSON.parse(savedOrders):[];biayaProduksiList=savedBiayaProduksi?JSON.parse(savedBiayaProduksi):[];galleryItems=savedGallery?JSON.parse(savedGallery):[];localStorage.setItem("savedDataHarga",JSON.stringify(dataHarga));localStorage.setItem("savedProfitPercentage",profitPercentage);}
    initializeData();

    // --- ELEMENT SELECTORS ---
    const pages={welcome:document.getElementById("welcomeScreen"),pelangganDashboard:document.getElementById("pelangganDashboardPage"),gallery:document.getElementById("galleryPage"),adminDashboard:document.getElementById("adminDashboardPage"),calculator:document.getElementById("calculatorPage"),updateHarga:document.getElementById("updateHargaPage"),settingKeuntungan:document.getElementById("settingKeuntunganPage"),rekapan:document.getElementById("rekapanPage"),biayaProduksi:document.getElementById("biayaProduksiPage"),galleryManagement:document.getElementById("galleryManagementPage")};
    const loginModal=document.getElementById("loginModal");let userRole="admin",currentPage=pages.welcome,hasilKalkulasi=null,grandTotalAsliCache;

    // --- JAM, TANGGAL & JADWAL SHOLAT LOGIC ---
    const clockDisplay=document.getElementById("clockDisplay"),gregorianDateDisplay=document.getElementById("gregorianDateDisplay"),hijriDateDisplay=document.getElementById("hijriDateDisplay"),prayerTimesContainer=document.getElementById("prayerTimesContainer");function updateDateTime(){const now=new Date;clockDisplay.textContent=now.toLocaleTimeString("id-ID",{hour12:!1});gregorianDateDisplay.textContent=now.toLocaleDateString("id-ID",{weekday:"long",year:"numeric",month:"long",day:"numeric"});hijriDateDisplay.textContent=(new Intl.DateTimeFormat("id-ID-u-ca-islamic",{day:"numeric",month:"long",year:"numeric"})).format(now)}setInterval(updateDateTime,1e3);updateDateTime();function getPrayerTimes(latitude,longitude){const date=new Date,year=date.getFullYear(),month=date.getMonth()+1,apiUrl=`https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=20`;fetch(apiUrl).then(response=>response.json()).then(data=>{const todayTimings=data.data[date.getDate()-1].timings;document.getElementById("fajrTime").textContent=todayTimings.Fajr;document.getElementById("dhuhrTime").textContent=todayTimings.Dhuhr;document.getElementById("asrTime").textContent=todayTimings.Asr;document.getElementById("maghribTime").textContent=todayTimings.Maghrib;document.getElementById("ishaTime").textContent=todayTimings.Isha;prayerTimesContainer.style.display="block"}).catch(error=>{console.error("Gagal mengambil jadwal sholat:",error);document.getElementById("locationDisplay").textContent="Gagal memuat jadwal sholat."})}function getLocation(){navigator.geolocation?navigator.geolocation.getCurrentPosition(position=>{const lat=position.coords.latitude,long=position.coords.longitude;document.getElementById("locationDisplay").textContent="Jadwal untuk lokasi Anda";getPrayerTimes(lat,long)},()=>{document.getElementById("locationDisplay").textContent="Izinkan akses lokasi untuk melihat jadwal sholat.";prayerTimesContainer.style.display="block"}):document.getElementById("locationDisplay").textContent="Browser tidak mendukung geolokasi."}getLocation();

    // --- NAVIGATION LOGIC ---
    function transitionPages(pageOut,pageIn){currentPage=pageIn;pageIn.classList.remove("hidden");pageOut.classList.add("animate-fade-out");pageIn.classList.add("animate-fade-in");pageOut.addEventListener("animationend",function handler(){pageOut.classList.add("hidden");pageOut.classList.remove("animate-fade-out");pageOut.removeEventListener("animationend",handler)});pageIn.addEventListener("animationend",function handler(){pageIn.classList.remove("animate-fade-in");pageIn.removeEventListener("animationend",handler)})}
    document.getElementById("adminBtn").addEventListener("click",()=>loginModal.classList.add("visible"));
    document.getElementById("pelangganBtn").addEventListener("click",()=>transitionPages(pages.welcome,pages.pelangganDashboard));
    document.getElementById("loginCancelBtn").addEventListener("click",()=>loginModal.classList.remove("visible"));
    document.getElementById("loginForm").addEventListener("submit",e=>{e.preventDefault();if("hamdi"===document.getElementById("usernameInput").value.toLowerCase()&&"P@dl4n"===document.getElementById("passwordInput").value){loginModal.classList.remove("visible");document.getElementById("usernameInput").value="";document.getElementById("passwordInput").value="";transitionPages(pages.welcome,pages.adminDashboard)}else{const loginBox=document.querySelector(".login-box");loginBox.classList.add("shake");setTimeout(()=>loginBox.classList.remove("shake"),500)}});
    document.getElementById('goToCalcPelangganBtn').addEventListener('click', () => { userRole = 'pelanggan'; document.getElementById('calculatorTitle').textContent = 'Kalkulator Harga Kalender'; document.getElementById('saveOrderBtn').style.display = 'none'; transitionPages(pages.pelangganDashboard, pages.calculator); });
    document.getElementById('goToGalleryBtn').addEventListener('click', () => { renderCustomerGallery(); transitionPages(pages.pelangganDashboard, pages.gallery); });
    document.getElementById('backToWelcomeBtn').addEventListener('click', () => transitionPages(pages.pelangganDashboard, pages.welcome));
    document.getElementById("goToCalcAdminBtn").addEventListener("click",()=>{userRole="admin";document.getElementById("calculatorTitle").textContent="Kalkulator Admin";transitionPages(pages.adminDashboard,pages.calculator)});
    document.getElementById("goToRekapanBtn").addEventListener("click",()=>{populateRekapanTable();transitionPages(pages.adminDashboard,pages.rekapan)});
    document.getElementById("goToBiayaProduksiBtn").addEventListener("click",()=>{renderBiayaProduksiPage();transitionPages(pages.adminDashboard,pages.biayaProduksi)});
    document.getElementById("goToGalleryManagementBtn").addEventListener("click",()=>{renderGalleryManagement();transitionPages(pages.adminDashboard,pages.galleryManagement)});
    document.getElementById("goToUpdateHargaBtn").addEventListener("click",()=>{populateUpdateHargaForm();transitionPages(pages.adminDashboard,pages.updateHarga)});
    document.getElementById("goToSettingUntungBtn").addEventListener("click",()=>{document.getElementById("profitPercentageInput").value=profitPercentage;transitionPages(pages.adminDashboard,pages.settingKeuntungan)});
    document.getElementById("logoutBtn").addEventListener("click",()=>transitionPages(pages.adminDashboard,pages.welcome));
    document.querySelectorAll(".back-btn").forEach(btn=>{btn.addEventListener("click",()=>{let target=pages.welcome;const isAdminSubPage=[pages.updateHarga,pages.settingKeuntungan,pages.rekapan,pages.biayaProduksi,pages.galleryManagement].includes(currentPage);const isPelangganSubPage=[pages.calculator,pages.gallery].includes(currentPage)&&"pelanggan"===userRole;if(currentPage===pages.calculator&&userRole==="admin"||isAdminSubPage){target=pages.adminDashboard}else if(isPelangganSubPage){target=pages.pelangganDashboard}transitionPages(currentPage,target)})});

    // --- UPDATE HARGA PAGE LOGIC ---
    function populateUpdateHargaForm(){const form=document.getElementById("updateHargaForm");let html="<h3>Harga Kertas (per cm²)</h3>";for(const k in dataHarga.kertas)html+=`<div class="form-group"><label for="k_${k}">${k}</label><input type="number" step="0.001" id="k_${k}" value="${dataHarga.kertas[k]}"></div>`;html+="<h3>Harga Cetak (per 2000 lbr)</h3>";for(const k in dataHarga.ukuranCetak)html+=`<div class="form-group"><label for="c_${k}">Ukuran ${k}</label><input type="number" id="c_${k}" value="${dataHarga.ukuranCetak[k]}"></div>`;html+="<h3>Harga Finishing (per cm lebar)</h3>";for(const k in dataHarga.finishing)html+=`<div class="form-group"><label for="f_${k}">${k}</label><input type="number" id="f_${k}" value="${dataHarga.finishing[k]}"></div>`;html+="<h3>Harga Lain-lain (per pcs)</h3>";html+=`<div class="form-group"><label for="ll_susun">Harga Susun</label><input type="number" id="ll_susun" value="${dataHarga.lainLain.susun}"></div>`;html+='<button type="submit" class="btn-save">Simpan Perubahan</button>';form.innerHTML=html}
    document.getElementById("updateHargaForm").addEventListener("submit",e=>{e.preventDefault();for(const k in dataHarga.kertas)dataHarga.kertas[k]=parseFloat(document.getElementById(`k_${k}`).value);for(const k in dataHarga.ukuranCetak)dataHarga.ukuranCetak[k]=parseInt(document.getElementById(`c_${k}`).value);for(const k in dataHarga.finishing)dataHarga.finishing[k]=parseFloat(document.getElementById(`f_${k}`).value);dataHarga.lainLain.susun=parseInt(document.getElementById("ll_susun").value);localStorage.setItem("savedDataHarga",JSON.stringify(dataHarga));alert("Harga berhasil disimpan!")});
    
    // --- SISA KODE ---
    const formatRupiah=angka=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",minimumFractionDigits:0}).format(angka),calculateBtn=document.getElementById("calculateBtn"),saveOrderBtn=document.getElementById("saveOrderBtn"),printBtn=document.getElementById("printBtn"),whatsappBtn=document.getElementById("whatsappBtn");printBtn.disabled=!0;whatsappBtn.disabled=!0;saveOrderBtn.disabled=!0;const inputs=document.querySelectorAll(".form-input");inputs.forEach(input=>{input.addEventListener("input",()=>{printBtn.disabled=!0;whatsappBtn.disabled=!0;saveOrderBtn.disabled=!0;hasilKalkulasi=null})});calculateBtn.addEventListener("click",()=>{const nama=document.getElementById("nama").value,ukuran=document.getElementById("ukuran").value,jumlahPcs=parseInt(document.getElementById("jumlahPcs").value)||0,jumlahHalaman=parseInt(document.getElementById("jumlahHalaman").value)||0,jenisKertas=document.getElementById("jenisKertas").value,jenisFinishing=document.getElementById("jenisFinishing").value;if(ukuran&&0<jumlahPcs&&0<jumlahHalaman&&jenisKertas){const dimensi=dataHarga.dimensi[ukuran],hargaCetak=dataHarga.ukuranCetak[ukuran],hargaKertasPerCm2=dataHarga.kertas[jenisKertas];let biayaFinishingSatuan="polos"!==jenisFinishing?dimensi.l*dataHarga.finishing[jenisFinishing]:0;const totalLembar=jumlahPcs*jumlahHalaman,totalBiayaKertas=dimensi.l*dimensi.p*hargaKertasPerCm2*totalLembar,totalBiayaCetak=Math.ceil(totalLembar/2e3)*hargaCetak,totalBiayaFinishing=biayaFinishingSatuan*jumlahPcs,totalBiayaSusun=dataHarga.lainLain.susun*jumlahPcs;grandTotalAsliCache=totalBiayaKertas+totalBiayaCetak+totalBiayaFinishing+totalBiayaSusun;const hargaPerPcsAsli=grandTotalAsliCache/jumlahPcs;let hargaPerPcsFinal=hargaPerPcsAsli*("pelanggan"===userRole?1+profitPercentage/100:1);const grandTotalFinal=hargaPerPcsFinal*jumlahPcs;document.getElementById("hargaPerPcsResult").textContent=formatRupiah(hargaPerPcsFinal);document.getElementById("hargaTotalResult").textContent=formatRupiah(grandTotalFinal);hasilKalkulasi={nama,ukuran,jumlahPcs,jumlahHalaman,jenisKertas,jenisFinishing,hargaPerPcs:hargaPerPcsFinal,grandTotal:grandTotalFinal,hargaModal:grandTotalAsliCache,keuntungan:hargaPerPcsFinal*jumlahPcs-grandTotalAsliCache};printBtn.disabled=!1;whatsappBtn.disabled=!1;"admin"===userRole&&(saveOrderBtn.style.display="block",saveOrderBtn.disabled=!1)}else alert("Mohon lengkapi data!")});

    // Fungsi untuk mengirim data order ke server
    async function kirimDataOrderKeServer(dataOrder) {
        // Ganti URL ini dengan URL API backend Anda (misalnya Google Sheets API atau Firebase)
        const serverURL = 'https://contoh-api-anda.com/simpan-order';

        try {
            const response = await fetch(serverURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataOrder),
            });

            if (response.ok) {
                console.log('Data order berhasil dikirim ke server.');
                return true;
            } else {
                console.error('Gagal mengirim data order ke server.');
                return false;
            }
        } catch (error) {
            console.error('Terjadi kesalahan saat mengirim data:', error);
            return false;
        }
    }

    // Fungsi tombol Simpan Order (khusus admin)
    saveOrderBtn.addEventListener("click", async () => {
        if (hasilKalkulasi && hasilKalkulasi.nama) {
            // Logika untuk mengirim data ke server
            const sukses = await kirimDataOrderKeServer(hasilKalkulasi);
            
            if (sukses) {
                // Jika berhasil, tambahkan ke localStorage juga untuk demo
                const namaFinishing={jepit:"Jepit Kaleng",ring:"Ring",polos:"Polos"};
                orderList.push({
                    id: Date.now(),
                    nama: hasilKalkulasi.nama,
                    tanggal: (new Date).toLocaleDateString("id-ID"),
                    detail: `Kalender ${hasilKalkulasi.jumlahHalaman} hal, ${hasilKalkulasi.ukuran}, ${hasilKalkulasi.jenisKertas}, Fin. ${namaFinishing[hasilKalkulasi.jenisFinishing]}`,
                    hargaTotal: hasilKalkulasi.grandTotal,
                    hargaModal: grandTotalAsliCache,
                    keuntungan: hasilKalkulasi.keuntungan,
                    statusPesanan: "Survei",
                    jumlahBayar: 0
                });
                localStorage.setItem("orderList", JSON.stringify(orderList));

                alert(`Order untuk ${hasilKalkulasi.nama} berhasil disimpan ke server!`);
                saveOrderBtn.disabled = true;
            } else {
                alert('Gagal menyimpan order. Coba lagi.');
            }
        } else {
            alert("Nama pemesan wajib diisi sebelum menyimpan!");
        }
    });

    // Fungsi tombol Order via WA (untuk pelanggan)
    whatsappBtn.addEventListener("click", async () => {
        if (hasilKalkulasi) {
            // Logika untuk mengirim data ke server
            const sukses = await kirimDataOrderKeServer(hasilKalkulasi);

            if (sukses) {
                // Jika berhasil, buat pesan WA
                const pesanWA = `Halo, saya ingin memesan kalender dengan rincian berikut:\n\n` +
                                `Nama: ${document.getElementById("nama").value || "Pelanggan"}\n` +
                                `Ukuran: ${hasilKalkulasi.ukuran}\n` +
                                `Jumlah: ${hasilKalkulasi.jumlahPcs} pcs\n` +
                                `Harga Total: ${formatRupiah(hasilKalkulasi.grandTotal)}\n\n` +
                                `Terima kasih.`;

                const nomorAdmin = "628123456789"; // Ganti dengan nomor WhatsApp admin
                const linkWA = `https://wa.me/${nomorAdmin}?text=${encodeURIComponent(pesanWA)}`;
                window.open(linkWA, '_blank');
            } else {
                alert('Gagal memproses order. Coba lagi.');
            }
        } else {
            alert("Mohon hitung terlebih dahulu!");
        }
    });

    // Fungsi lainnya, perbarui jika perlu
    function populateRekapanTable(){
        // Dalam implementasi nyata, data akan diambil dari server di sini
        // fetch('URL_API_ANDA/orders').then(response => response.json()).then(data => { ... });
        const tableBody=document.getElementById("rekapTableBody"),summaryDiv=document.getElementById("rekapSummary");tableBody.innerHTML="";let totalKeuntungan=0;0===orderList.length?tableBody.innerHTML='<tr><td colspan="8" style="text-align:center;">Belum ada data order.</td></tr>':orderList.forEach(order=>{totalKeuntungan+=order.keuntungan;const sisaBayar=order.hargaTotal-order.jumlahBayar,statusLunas=sisaBayar<=0?"Lunas":"Belum Lunas",row=document.createElement("tr");row.innerHTML=`<td>${order.nama}</td><td>${order.tanggal}</td><td><select class="status-order-select"><option ${"Survei"===order.statusPesanan?"selected":""}>Survei</option><option ${"Desain"===order.statusPesanan?"selected":""}>Desain</option><option ${"Cetak"===order.statusPesanan?"selected":""}>Cetak</option><option ${"Antar"===order.statusPesanan?"selected":""}>Antar</option><option ${"Beres"===order.statusPesanan?"selected":""}>Beres</option></select></td><td>${formatRupiah(order.hargaTotal)}</td><td><input type="number" class="payment-input" value="${order.jumlahBayar}"></td><td>${formatRupiah(sisaBayar)} (${statusLunas})</td><td>${formatRupiah(order.keuntungan)}</td><td><button class="btn-rekap-action btn-rekap-save" data-id="${order.id}">Simpan</button><button class="btn-rekap-action btn-rekap-delete" data-id="${order.id}">Hapus</button></td>`;tableBody.appendChild(row)});summaryDiv.innerHTML=`<div class="summary-box"><h3>Total Keuntungan</h3><p>${formatRupiah(totalKeuntungan)}</p></div>`}}
    document.getElementById("rekapTableBody").addEventListener("click",e=>{const orderId=parseInt(e.target.dataset.id);if(e.target.classList.contains("btn-rekap-save")){const orderIndex=orderList.findIndex(o=>o.id===orderId);-1<orderIndex&&(orderList[orderIndex].statusPesanan=e.target.closest("tr").querySelector(".status-order-select").value,orderList[orderIndex].jumlahBayar=parseFloat(e.target.closest("tr").querySelector(".payment-input").value)||0,localStorage.setItem("orderList",JSON.stringify(orderList)),alert("Perubahan berhasil disimpan!"),populateRekapanTable())}else e.target.classList.contains("btn-rekap-delete")&&confirm("Apakah Anda yakin ingin menghapus order ini secara permanen?")&&(orderList=orderList.filter(o=>o.id!==orderId),localStorage.setItem("orderList",JSON.stringify(orderList)),alert("Order berhasil dihapus."),populateRekapanTable())});function renderBiayaProduksiPage(){const projectSelect=document.getElementById("projectSelect"),tableBody=document.getElementById("biayaProduksiTableBody");projectSelect.innerHTML='<option value="">-- Pilih Proyek --</option>';orderList.forEach(order=>{projectSelect.innerHTML+=`<option value="${order.id}">${order.nama} (${order.tanggal})</option>`});tableBody.innerHTML="";if(0===biayaProduksiList.length)tableBody.innerHTML='<tr><td colspan="5" style="text-align:center;">Belum ada data biaya produksi.</td></tr>';biayaProduksiList.forEach(biaya=>{const order=orderList.find(o=>o.id===biaya.orderId),sisaUtang=biaya.totalBiaya-biaya.jumlahBayar,status=sisaUtang<=0?"Lunas":"Belum Lunas",row=document.createElement("tr");row.innerHTML=`<td>${order?order.nama:"Proyek Dihapus"}</td><td>${formatRupiah(biaya.totalBiaya)}</td><td>${formatRupiah(biaya.jumlahBayar)}</td><td>${formatRupiah(sisaUtang)}</td><td>${status}</td>`;tableBody.appendChild(row)})}document.getElementById("biayaProduksiForm").addEventListener("submit",e=>{e.preventDefault();const orderId=parseInt(document.getElementById("projectSelect").value),totalBiaya=parseFloat(document.getElementById("totalBiayaProduksi").value),jumlahBayar=parseFloat(document.getElementById("jumlahBayarProduksi").value);if(orderId&&!isNaN(totalBiaya)&&!isNaN(jumlahBayar)){const existingIndex=biayaProduksiList.findIndex(b=>b.orderId===orderId);-1<existingIndex?(biayaProduksiList[existingIndex].totalBiaya=totalBiaya,biayaProduksiList[existingIndex].jumlahBayar=jumlahBayar):biayaProduksiList.push({orderId,totalBiaya,jumlahBayar});localStorage.setItem("biayaProduksiList",JSON.stringify(biayaProduksiList));alert("Data biaya produksi berhasil disimpan!");document.getElementById("biayaProduksiForm").reset();renderBiayaProduksiPage()}else alert("Mohon isi semua kolom dengan benar.")});printBtn.addEventListener("click",()=>{hasilKalkulasi&&alert("Fungsi Cetak Nota belum diimplementasikan.")});
});
