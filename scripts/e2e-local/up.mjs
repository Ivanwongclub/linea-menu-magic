import { prepare, start, status, adminClient, ensureEditor, WORK_DIR } from "./lib/stack.mjs";

prepare();
start();
const st = status();
const editor = await ensureEditor(adminClient(st));

console.log(
  JSON.stringify(
    { workDir: WORK_DIR, apiUrl: st.API_URL, studio: st.STUDIO_URL, editor: { email: editor.email, password: editor.password } },
    null,
    2,
  ),
);
