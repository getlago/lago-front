module.exports = {
  hooks: {
    readPackage(pkg) {
      // Block postinstall script for a specific package
      if (pkg.name !== "lago-front") return pkg;

      delete pkg.scripts.postinstall;
      delete pkg.dependencies["lago-design-system"];
      delete pkg.dependencies["lago-configs"];

      return pkg;
    }
  }
}
