declare namespace svelteHTML {
    interface HTMLAttributes<T> {
        // Add custom event handler for `on:swipe`
        'on:swipe'?: (event: CustomEvent<any>) => void;
    }
}
