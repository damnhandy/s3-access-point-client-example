with (import <nixpkgs> {});
mkShell {
  buildInputs = [
    nodejs-18_x
    awscli2
  ];
  shellHook = ''
      mkdir -p ~/.npm-global
      export NODE_PATH=~/.npm-global
      npm config set prefix=~/.npm-global
      export PATH=$NODE_PATH/bin:$PATH
      export CDK_DEFAULT_ACCOUNT=226350727888
      export CDK_DEFAULT_REGION=us-east-1
      npm install npm -g 
  '';
}