import { db } from "./db";
import fs from "fs";

function render(content: string) {
  const layout = fs.readFileSync("./views/layout/main.html", "utf8");
  return layout.replace("{{content}}", content);
}

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // 1. DASHBOARD
    if (url.pathname == "/") {
      const [rows]: any = await db.query("SELECT COUNT(*) as total FROM mahasiswa");
      let view = fs.readFileSync("./views/dashboard/index.html", "utf8");
      view = view.replace("{{total}}", rows[0].total);
      return new Response(render(view), { headers: { "Content-Type": "text/html" } });
    }

    // 2. LIST MAHASISWA (Pake JOIN biar muncul nama jurusan)
    if (url.pathname == "/mahasiswa") {
      const [rows]: any = await db.query("SELECT * FROM mahasiswa");
      let tableRows = "";
      rows.forEach((m: any) => {
        tableRows += `
        <tr class="border-b">
          <td class="p-2 text-center">${m.id}</td>
          <td class="p-2">${m.nama}</td>
          <td class="p-2">${m.jurusan}</td>
          <td class="p-2 text-center">${m.angkatan}</td>
          <td class="p-2 text-center">
            <a href="/mahasiswa/edit/${m.id}" class="text-blue-500">Edit</a>
            <a href="/mahasiswa/delete/${m.id}" class="text-red-500 ml-2">Hapus</a>
          </td>
        </tr>`;
      });
      let view = fs.readFileSync("./views/mahasiswa/index.html", "utf8");
      view = view.replace("{{rows}}", tableRows);
      return new Response(render(view), { headers: { "Content-Type": "text/html" } });
    }

    // 3. FORM TAMBAH MAHASISWA (Dinamis Dropdown)
    if (url.pathname == "/mahasiswa/create") {
      const [jurusans]: any = await db.query("SELECT * FROM jurusan");
      let options = "";
      jurusans.forEach((j: any) => {
        options += `<option value="${j.nama_jurusan}">${j.nama_jurusan}</option>`;
      });

      let view = fs.readFileSync("./views/mahasiswa/create.html", "utf8");
      view = view.replace("{{jurusan_options}}", options);
      return new Response(render(view), { headers: { "Content-Type": "text/html" } });
    }

    // 4. SIMPAN DATA MAHASISWA
    if (url.pathname == "/mahasiswa/store" && req.method == "POST") {
      const body = await req.formData();
      await db.query(
        "INSERT INTO mahasiswa (nama, jurusan, angkatan) VALUES (?, ?, ?)",
        [body.get("nama"), body.get("jurusan"), body.get("angkatan")]
      );
      return Response.redirect("/mahasiswa", 302);
    }

    // --- FITUR JURUSAN ---

    // 5. LIST JURUSAN
    if (url.pathname == "/jurusan") {
      const [rows]: any = await db.query("SELECT * FROM jurusan");
      let tableRows = "";
      rows.forEach((j: any) => {
        tableRows += `
        <tr class="border-b">
          <td class="p-2 text-center">${j.id}</td>
          <td class="p-2">${j.nama_jurusan}</td>
          <td class="p-2 text-center">
            <a href="/jurusan/edit/${j.id}" class="text-blue-500">Edit</a>
            <a href="/jurusan/delete/${j.id}" class="text-red-500 ml-2">Hapus</a>
          </td>
        </tr>`;
      });
      let view = fs.readFileSync("./views/jurusan/index.html", "utf8");
      view = view.replace("{{rows}}", tableRows);
      return new Response(render(view), { headers: { "Content-Type": "text/html" } });
    }

    // 6. FORM TAMBAH JURUSAN
    if (url.pathname == "/jurusan/create") {
      let view = fs.readFileSync("./views/jurusan/create.html", "utf8");
      return new Response(render(view), { headers: { "Content-Type": "text/html" } });
    }

    // 7. SIMPAN JURUSAN
    if (url.pathname == "/jurusan/store" && req.method == "POST") {
      const body = await req.formData();
      await db.query("INSERT INTO jurusan (nama_jurusan) VALUES (?)", [body.get("nama_jurusan")]);
      return Response.redirect("/jurusan", 302);
    }

    // --- EDIT & DELETE (Mahasiswa/Jurusan) tetep sama logikanya ---
    // (Tambahkan rute edit/delete jurusan di bawah sini jika diperlukan)

    return new Response("Halaman tidak ditemukan", { status: 404 });
  }
});

console.log("Server berjalan di http://localhost:3000");