import axios from 'axios';
import { WorkshopFetcher } from '../../src/classes/WorkshopFetcher';
import { WorkshopParser } from '../../src/classes/WorkshopParser';
import { PageResponse } from '../../src/types/PageResponse';

jest.mock('axios');
jest.mock('../../src/classes/WorkshopParser');

const mockedAxios = jest.mocked(axios);
const mockedWorkshopParser = jest.mocked(WorkshopParser);

describe(WorkshopFetcher.name, () => {
    describe(WorkshopFetcher.prototype.fetchNumPages.name, () => {
        const data = 'fake data';
        const response: PageResponse = { ids: [], pageCount: 123 };

        afterAll(() => {
            jest.clearAllMocks();
        });

        beforeAll(async () => {
            mockedAxios.get.mockResolvedValueOnce({ data });
            mockedWorkshopParser.parsePage.mockReturnValueOnce(response as unknown as string[]);

            await new WorkshopFetcher(false).fetchNumPages();
        });

        it('makes a network request', () => {
            expect(mockedAxios.get).toBeCalledTimes(1);
            expect(mockedAxios.get).toBeCalledWith(
                'https://steamcommunity.com/workshop/browse',
                expect.objectContaining({ params: expect.objectContaining({ p: 1 }) }),
            );
        });

        it('parses the response', () => {
            expect(mockedWorkshopParser.parsePage).toBeCalledTimes(1);
            expect(mockedWorkshopParser.parsePage).toBeCalledWith(data, true);
        });
    });

    describe(WorkshopFetcher.fetchSingleItem.name, () => {
        const id = 'fake id';
        const data = 'fake data';

        afterAll(() => {
            jest.clearAllMocks();
        });

        beforeAll(async () => {
            mockedAxios.get.mockResolvedValueOnce({ data });

            await WorkshopFetcher.fetchSingleItem(id);
        });

        it('makes a network request', () => {
            expect(mockedAxios.get).toBeCalledTimes(1);
            expect(mockedAxios.get).toBeCalledWith(
                'https://steamcommunity.com/sharedfiles/filedetails',
                expect.objectContaining({ params: expect.objectContaining({ id }) }),
            );
        });

        it('parses the response', () => {
            expect(mockedWorkshopParser).toBeCalledTimes(1);
            for (const method of Object.keys(mockedWorkshopParser.prototype)) {
                expect(mockedWorkshopParser.prototype[method as keyof WorkshopParser]).toBeCalledTimes(1);
            }
        });
    });
});
