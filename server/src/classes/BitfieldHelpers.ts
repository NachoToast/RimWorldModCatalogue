export class BitfieldHelpers {
    private constructor() {
        //
    }

    /** Splits a bitfield into its individual values. */
    public static explode<T extends number>(bitfield: number): T[] {
        const values: T[] = [];

        while (bitfield) {
            const bit = bitfield & (~bitfield + 1);
            values.push(bit as T);
            bitfield ^= bit;
        }

        return values;
    }
}
