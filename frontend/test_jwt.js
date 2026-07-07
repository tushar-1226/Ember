const { SignJWT } = require('jose');
async function run() {
  const secretText = "default_super_secret_for_local_dev_only";
  const secret = new TextEncoder().encode(secretText);
  const token = await new SignJWT({ sub: "test_user" })
    .setProtectedHeader({ alg: "HS256" })
    .sign(secret);
  console.log(token);
}
run();
