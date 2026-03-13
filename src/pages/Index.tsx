const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Development banner */}
      <div className="w-full bg-warning/10 border-b border-warning/20 px-4 py-2 text-center">
        <p className="text-sm font-medium text-warning">🚧 Programa em desenvolvimento</p>
      </div>
      <div className="flex min-h-[calc(100vh-40px)] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">Welcome to Your Blank App</h1>
          <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
