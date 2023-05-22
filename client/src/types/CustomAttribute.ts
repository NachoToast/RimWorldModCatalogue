export enum CustomAttribute {
    /** The name of a component to generate. */
    Generate = 'rwmc-generate',

    /** The value of an "input", used in form events. */
    Value = 'rwmc-value',

    /** The state of an "input", used in form events. */
    State = 'rwmc-state',

    /** The type of an includer component, should be either `dlc` or `tag`. */
    IncluderType = 'rwmc-includer-type',
}
