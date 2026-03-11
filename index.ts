import { db } from "./db";
import fs from "fs";

function render(view: string, content: string) {
  const layout = fs.readFileSync("./views/layout.html", "utf8");
  return layout.replace("{{content}}", content);
}

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // LIST DATA
    if (url.pathname == "/") {
      const [rows]: any = await db.query("SELECT * FROM mahasiswa");
      let table = "";
      rows.forEach((m: any) => {
        table += `
        <tr>
          <td class="p-2">${m.id}</td>
          <td class="p-2">${m.nama}</td>
          <td class="p-2">${m.jurusan}</td>
          <td class="p-2">${m.angkatan}</td>
          <td class="p-2">
            <a class="text-blue-500" href="/edit/${m.id}">Edit</a>
            <a class="text-red-500 ml-2" href="/hapus/${m.id}">Hapus</a>
          </td>
        </tr>
        `;
      });

      let view = fs.readFileSync("./views/mahasiswa.html", "utf8");
      view = view.replace("{{rows}}", table);
      return new Response(render("mahasiswa", view), {
        headers: { "Content-Type": "text/html" }
      });
    }

    // FORM TAMBAH
    if (url.pathname == "/tambah") {
      let view = fs.readFileSync("./views/form.html", "utf8");
      view = view
        .replace("{{action}}", "/simpan")
        .replace("{{nama}}", "")
        .replace("{{jurusan}}", "")
        .replace("{{angkatan}}", "");
      return new Response(render("form", view), {
        headers: { "Content-Type": "text/html" }
      });
    }

    // SIMPAN DATA
    if (url.pathname == "/simpan" && req.method == "POST") {
      const body = await req.formData();
      await db.query(
        "INSERT INTO mahasiswa (nama, jurusan, angkatan) VALUES (?, ?, ?)",
        [
          body.get("nama"),
          body.get("jurusan"),
          body.get("angkatan")
        ]
      );
      return Response.redirect("/", 302);
    }

    // HAPUS DATA
    if (url.pathname.startsWith("/hapus/")) {
      const id = url.pathname.split("/")[2];
      await db.query(
        "DELETE FROM mahasiswa WHERE id=?",
        [id]
      );
      return Response.redirect("/", 302);
    }

    return new Response("Not Found");
  }
});