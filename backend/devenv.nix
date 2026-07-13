{ pkgs, ... }:

{
  languages.python = {
    enable = true;
    package = pkgs.python312;
    venv.enable = true;
    venv.requirements = ./requirements.txt;
  };

  services.postgres = {
    enable = true;
    listen_addresses = "127.0.0.1";
    port = 5433;
    initialDatabases = [ { name = "memoryagent"; } ];
    extensions = extensions: [ extensions.pgvector ];
    initialScript = ''
      CREATE ROLE "user" WITH LOGIN SUPERUSER PASSWORD 'password';
      \connect memoryagent
      CREATE EXTENSION IF NOT EXISTS vector;
    '';
  };

  services.redis = {
    enable = true;
    bind = "127.0.0.1";
    port = 6379;
  };

  env.POSTGRES_URL = "postgresql://user:password@127.0.0.1:5433/memoryagent";
  env.REDIS_URL = "redis://127.0.0.1:6379/0";
  env.PYTHONUNBUFFERED = "1";

  processes.backend.exec = "uvicorn main:app --reload --host 0.0.0.0 --port 8080";
}
