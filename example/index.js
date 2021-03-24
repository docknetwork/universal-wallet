import MyIndex from '../src/index';

async function main() {
  const index = new MyIndex();
  console.log('index', index);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
