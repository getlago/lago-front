## Folder architecture

The folder architecture is a really hard and vast subject.

Here at Lago, we try to keep the concepts as simple and straightforward as possible. This is why, we want our folder architecture to be simple to understand and to dive in

The folders are created around the ideas of features. features that have finite scope and live around the page it presents its concepts.

Here is how we structure our folders

```tsx
src/
|-- components/
|---- MySharedComponent/
|------ MySharedComponent.tsx
|------ types.ts
|------ componentLogic.ts
|------ __tests__/
|-------- MySharedComponent.test.tsx
|-------- componentLogic.test.ts
|-- core/
|---- sharedLogicFunction.ts
|---- __tests__/
|------ sharedLogicfunction.test.ts
|-- hooks/
|---- useSharedHook.ts
|---- __tests__/
|------ useSharedhook.test.ts
|-- pages/
|---- myFeature/
|------ MyFeaturePage.ts
|------ common/
|-------- aLogicFunction.ts
|-------- ASharedComponent.tsx
|-------- __tests__/
|---------- aLogicFunction.test.ts
|---------- ASharedComponent.test.tsx
|------ ANotSharedComponent/
|-------- ANotSharedComponent.tsx
|-------- useNotSharedFeatureHook.ts
|-------- __tests__/
|---------- ANotSharedComponent.test.tsx
|---------- useNotSharedFeatureHook.test.ts
```

The idea behind this is simple: keep it as close to where it's used as possible until you need it elsewhere.

If you need it somewhere else, this means that it becomes shared thus we move it one folder up.
As an example, if our `useNotSharedFeatureHook.ts` was to be shared in differents components of the same feature, it would go to the `common` folder.

And if we needed it in components from other features, we would move it to the `hooks` folder where it would be shared throughout the whole application
