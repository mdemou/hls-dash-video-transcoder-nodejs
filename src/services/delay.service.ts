// export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const delayService = {
  wait: async (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};

export default delayService;
