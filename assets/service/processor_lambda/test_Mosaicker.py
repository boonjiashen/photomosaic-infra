from unittest import TestCase

from numpy import ndarray

from Mosaicker import AppMosaicker
import matplotlib.pyplot


def assert_same_num_channels(self, im1: ndarray, im2: ndarray):
    self.assertEqual(im1.shape[2], im2.shape[2])


def assert_approx_same_size(self, im1: ndarray, im2: ndarray):
    # Assert that for each dimension, the lengths are within `margin`% of each other
    margin = 0.1  # 0.1 = 10%
    for len1, len2 in list(zip(im1.shape, im2.shape))[:2]:
        self.assertTrue(1 - margin < len1 / len2 < 1 + margin)


class TestAppMosaicker(TestCase):

    mosaicker = AppMosaicker()

    def test_AppMosaickerShouldMosaic300PxlImage(self):
        im = matplotlib.pyplot.imread("test_images/test_image_300x300.jpeg")
        output_im = self.mosaicker.compute_mosaick(im)

        assert_same_num_channels(self, im, output_im)
        assert_approx_same_size(self, im, output_im)

    def test_AppMosaickerShouldMosaicImageWithAlpha(self):
        im = matplotlib.pyplot.imread("test_images/with_alpha_127x300.png")
        output_im = self.mosaicker.compute_mosaick(im)

        assert_approx_same_size(self, im, output_im)
