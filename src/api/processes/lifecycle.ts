export const handleProcessEvents = () => {
  process.on('unhandledRejection', (err) => {
    console.error('unhandledRejection');
    console.error(err);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    console.log('Shutting down server...');
    process.exit(0);
  });
};
